// eslint-disable-next-line max-classes-per-file
import * as fs from 'fs';
import { parse } from 'fast-xml-parser/src/parser';
import ProcessDto from '../../lib/Utils/ProcessDto';
import DIContainer from '../../lib/DIContainer/Container';
import { ICommonNode } from '../../lib/Commons/ICommonNode';
import {
  FORCE_TARGET_QUEUE, get, REPEAT_HOPS, REPEAT_MAX_HOPS, RESULT_CODE, WORKER_FOLLOWERS,
} from '../../lib/Utils/Headers';
import ResultCode from '../../lib/Utils/ResultCode';
import { mockCurl, TestNode } from './TesterHelpers';
import CoreServices from '../../lib/DIContainer/CoreServices';

export default class TopologyTester {
  private _nodes: TestNode[] = [];

  constructor(private _container: DIContainer, private _file: string) {
  }

  public async runTopology(topologyPath: string, dto: ProcessDto): Promise<ProcessDto[]> {
    // Parse BPMN scheme
    this._nodes = this._parseTopologyFile(topologyPath);

    // Find first nodes
    const starts = this._nodes.filter((node) => node.previous.length <= 0);
    if (starts.length <= 0) {
      throw new Error('Topology has no start nodes!');
    }

    // Iterate over all nodes
    const results: ProcessDto[] = [];
    await Promise.all(
      await starts.map(async (node) => {
        results.push(
          ...await this._recursiveRunner(node, dto),
        );
      }),
    );

    return results;
  }

  private _parseTopologyFile = (path: string): TestNode[] => {
    const buff = fs.readFileSync(path);
    const res = parse(buff.toString(), { ignoreAttributes: false, ignoreNameSpace: true });

    // Parse a compile TestNodes
    const nodes: TestNode[] = [];
    res.definitions.process.task.forEach((task: Record<string, string>) => {
      const node = new TestNode(task['@_id'], task['@_name'], task['@_pipesType']);
      nodes.push(node);
    });

    res.definitions.process.sequenceFlow.forEach((line: Record<string, string>) => {
      const from = nodes.findIndex((node) => node.id === line['@_sourceRef']);
      const to = nodes.findIndex((node) => node.id === line['@_targetRef']);

      if (from >= 0) {
        nodes[from].followers.push({ id: nodes[to].id, name: nodes[to].name });
        nodes[to].previous.push({ id: nodes[from].id, name: nodes[from].name });
      }
    });

    return nodes;
  };

  private async _recursiveRunner(node: TestNode, dto: ProcessDto, _index = 0): Promise<ProcessDto[]> {
    // Get worker instance from container
    let worker: ICommonNode;
    switch (node.type) {
      case 'connector':
        worker = this._container.getConnector(node.name);
        break;
      case 'batch':
        worker = this._container.getBatch(node.name);
        break;
      case 'custom':
        worker = this._container.getCustomNode(node.name);
        break;
      default:
        throw new Error(`Unsupported node type [${node.type}]`);
    }

    let index = _index;
    if (index >= 255) {
      throw new Error(`Node [${node.name}] has reached [${index}] iterations. Process has been stopped!`);
    }

    dto.addHeader(WORKER_FOLLOWERS, JSON.stringify(node.toWorkerFollowerHeader()));

    const nextDto: ProcessDto[] = [];
    let out = await this._processAction(worker, node, dto, index);

    let { followers } = node;
    const results: ProcessDto[] = [];
    switch (get(RESULT_CODE, out.headers)) {
      // Status has not provided => success
      case undefined:
        dto.removeHeader(RESULT_CODE);
        nextDto.push(out);
        break;
      // Success end and exit
      case ResultCode.DO_NOT_CONTINUE.toString():
        dto.removeHeader(RESULT_CODE);
        results.push(out);
        return results;
      // Re routing
      case ResultCode.FORWARD_TO_TARGET_QUEUE.toString():
        followers = node.reduceFollowersByHeader(get(FORCE_TARGET_QUEUE, out.headers) ?? '');
        dto.removeHeader(RESULT_CODE);
        nextDto.push(out);
        break;
      // Message want to be repeated
      case ResultCode.REPEAT.toString():
        index += 1;
        dto.addHeader(REPEAT_HOPS, String(parseInt(dto.getHeader(REPEAT_HOPS, '0') as string, 10) + 1));
        if (parseInt(get(REPEAT_HOPS, dto.headers) ?? '0', 10)
          >= parseInt(get(REPEAT_MAX_HOPS, dto.headers) ?? '0', 10)) {
          throw new Error('Repeater has used last try and still need to repeat.');
        }
        dto.removeHeader(RESULT_CODE);
        [out] = (await this._recursiveRunner(node, dto, index));
        nextDto.push(out);
        break;
      // Repeat batch until cursor ends and send only one message
      case ResultCode.BATCH_CURSOR_ONLY.toString():
        index += 1;
        dto.setBatchCursor(out.getBatchCursor());
        dto.removeHeader(RESULT_CODE);
        [out] = (await this._recursiveRunner(node, dto, index));
        nextDto.push(this._cloneProcessDto(out, {}));
        break;
      // Repeat batch until cursor ends and store message
      case ResultCode.BATCH_CURSOR_WITH_FOLLOWERS.toString():
        (out.jsonData as Array<Record<string, undefined>>).forEach((item) => {
          nextDto.push(this._cloneProcessDto(out, item));
        });
        index += 1;
        dto.setBatchCursor(out.getBatchCursor());
        dto.removeHeader(RESULT_CODE);
        [out] = (await this._recursiveRunner(node, dto, index));
        break;
      default:
        if (get(RESULT_CODE, out.headers) !== '0') {
          throw new Error(
            `Node [${node.name}] has returned non success result code [${get(RESULT_CODE, out.headers)}].`,
          );
        }
    }

    await Promise.all(
      nextDto.map(async (d) => {
        // Prepare out ProcessDto for followers
        d.removeRepeater();
        d.removeHeader(RESULT_CODE);

        // Run process on followers
        if (followers.length <= 0) {
          results.push(d);
        } else {
          await Promise.all(
            followers.map(async (follower) => {
              const fIndex = this._nodes.findIndex((n) => n.id === follower.id);
              results.push(
                ...await this._recursiveRunner(this._nodes[fIndex], d),
              );
            }),
          );
        }
      }),
    );

    return results;
  }

  private async _processAction(worker: ICommonNode, node: TestNode, dto: ProcessDto, index = 0): Promise<ProcessDto> {
    const spy = mockCurl(worker, this._file, this._container.get(CoreServices.CURL), node.id, index);
    const out = await worker.processAction(dto);
    if (spy) {
      spy.mockRestore();
    }

    return out;
  }

  private _cloneProcessDto = (dto: ProcessDto, body?: Record<string, undefined>): ProcessDto => {
    const clone = new ProcessDto();
    clone.headers = dto.headers;
    if (body) {
      clone.jsonData = body;
    } else {
      clone.data = dto.data;
    }

    return clone;
  };
}
