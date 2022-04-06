// eslint-disable-next-line max-classes-per-file
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import ProcessDto from '../../lib/Utils/ProcessDto';
import DIContainer from '../../lib/DIContainer/Container';
import { ICommonNode } from '../../lib/Commons/ICommonNode';
import {
  FORCE_TARGET_QUEUE,
  get,
  REPEAT_HOPS,
  REPEAT_MAX_HOPS,
  RESULT_CODE,
  RESULT_MESSAGE,
  WORKER_FOLLOWERS,
} from '../../lib/Utils/Headers';
import ResultCode from '../../lib/Utils/ResultCode';
import { mockNodeCurl, TestNode } from './TesterHelpers';
import CoreServices from '../../lib/DIContainer/CoreServices';
import OnRepeatException from '../../lib/Exception/OnRepeatException';

export default class TopologyTester {
  private _nodes: TestNode[] = [];

  constructor(
    private _container: DIContainer,
    private _file: string,
    private _forceMock = false,
    private _excludeList: string[] = [],
  ) {
  }

  public async runTopology(
    topologyPath: string,
    dto: ProcessDto,
    _prefix = '',
    _startingPoint?: string,
  ): Promise<ProcessDto[]> {
    // Parse BPMN scheme
    this._nodes = this._parseTopologyFile(topologyPath);

    // Find first nodes
    const starts = this._nodes.filter((node) => node.previous.length <= 0);
    if (starts.length <= 0) {
      throw new Error('Topology has no start nodes!');
    }

    // Iterate over all nodes
    const results: ProcessDto[] = [];
    while (starts.length > 0) {
      const startNode = starts.shift();
      if (startNode) {
        if (_startingPoint) {
          if (_startingPoint === startNode.name) {
            results.push(
              // eslint-disable-next-line no-await-in-loop
              ...await this._recursiveRunner(startNode, this._cloneProcessDto(dto), _prefix),
            );
          }
        } else {
          results.push(
            // eslint-disable-next-line no-await-in-loop
            ...await this._recursiveRunner(startNode, this._cloneProcessDto(dto), _prefix),
          );
        }
      }
    }

    return results;
  }

  private _parseTopologyFile = (path: string): TestNode[] => {
    const buff = fs.readFileSync(path);
    const res = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }).parse(buff.toString());

    // Parse a compile TestNodes
    const nodes: TestNode[] = [];

    this._pushNodes(res.definitions.process.task, nodes);
    this._pushNodes(res.definitions.process.event, nodes);

    let { sequenceFlow } = res.definitions.process;
    if (!Array.isArray(sequenceFlow)) {
      sequenceFlow = [sequenceFlow];
    }

    sequenceFlow.forEach((line: Record<string, string>) => {
      const from = nodes.findIndex((node) => node.id === line['@_sourceRef']);
      const to = nodes.findIndex((node) => node.id === line['@_targetRef']);

      if (from >= 0) {
        nodes[from].followers.push({ id: nodes[to].id, name: nodes[to].name });
        nodes[to].previous.push({ id: nodes[from].id, name: nodes[from].name });
      }
    });

    return nodes;
  };

  private _pushNodes = (_srcList: Record<string, string>[], dstList: TestNode[]) => {
    let list = _srcList;
    if (!Array.isArray(list)) {
      list = [list];
    }

    list.forEach((event: Record<string, string>) => {
      dstList.push(
        new TestNode(event['@_id'], event['@_name'], event['@_pipesType']),
      );
    });
  };

  private async _recursiveRunner(node: TestNode, dto: ProcessDto, prefix: string, _index = 0): Promise<ProcessDto[]> {
    // Get worker instance from container
    let worker: ICommonNode | null;
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
      case 'start':
      case 'cron':
      case 'webhook':
        worker = null;
        break;
      default:
        throw new Error(`Unsupported node type [${node.type}]`);
    }

    let index = _index;
    if (index >= 255) {
      throw new Error(`Node [${node.name}] has reached [${index}] iterations. Process has been stopped!`);
    }

    dto.addHeader(WORKER_FOLLOWERS, JSON.stringify(node.toWorkerFollowerHeader()));
    dto.removeHeader(RESULT_MESSAGE);

    const nextDto: ProcessDto[] = [];
    let out: ProcessDto;
    try {
      if (worker) {
        out = await this._processAction(worker, node, this._cloneProcessDto(dto), prefix, index);
      } else {
        out = this._cloneProcessDto(dto);
      }
    } catch (e) {
      if (e instanceof OnRepeatException) {
        out = this._cloneProcessDto(dto);
        out.addHeader(RESULT_CODE, ResultCode.REPEAT.toString());
        out.addHeader(REPEAT_MAX_HOPS, e.getMaxHops().toString());
      } else {
        throw e;
      }
    }

    let { followers } = node;
    const results: ProcessDto[] = [];
    switch (get(RESULT_CODE, out.headers)) {
      // Status has not provided => success
      case undefined:
        if (node.type === 'batch') {
          this._pushMultiple(nextDto, out);
        } else {
          nextDto.push(out);
        }
        break;
      // Success end and exit
      case ResultCode.DO_NOT_CONTINUE.toString():
        results.push(out);
        return results;
      // Re routing
      case ResultCode.FORWARD_TO_TARGET_QUEUE.toString():
        followers = node.reduceFollowersByHeader(...(get(FORCE_TARGET_QUEUE, out.headers) ?? '').split(','));
        nextDto.push(out);
        break;
      // Message want to be repeated
      case ResultCode.REPEAT.toString():
        index += 1;
        dto.addHeader(REPEAT_HOPS, String(parseInt(out.getHeader(REPEAT_HOPS, '0') as string, 10) + 1));
        if (parseInt(get(REPEAT_HOPS, out.headers) ?? '0', 10)
          >= parseInt(get(REPEAT_MAX_HOPS, out.headers) ?? '0', 10)) {
          throw new Error('Repeater has used last try and still need to repeat.');
        }
        dto.removeHeader(RESULT_CODE);
        [out] = (await this._recursiveRunner(node, this._cloneProcessDto(dto), prefix, index));
        nextDto.push(out);
        break;
      // Repeat batch until cursor ends and send only one message
      case ResultCode.BATCH_CURSOR_ONLY.toString():
        index += 1;
        dto.setBatchCursor(out.getBatchCursor());
        dto.removeHeader(RESULT_CODE);
        [out] = (await this._recursiveRunner(node, this._cloneProcessDto(dto), prefix, index));
        nextDto.push(this._cloneProcessDto(out, {}));
        break;
      // Repeat batch until cursor ends and store message
      case ResultCode.BATCH_CURSOR_WITH_FOLLOWERS.toString():
        this._pushMultiple(nextDto, out);
        index += 1;
        dto.setBatchCursor(out.getBatchCursor());
        dto.removeHeader(RESULT_CODE);
        [out] = (await this._recursiveRunner(node, this._cloneProcessDto(dto), prefix, index));
        break;
      default:
        if (get(RESULT_CODE, out.headers) !== '0') {
          throw new Error(
            `Node [${node.name}] has returned non success result code [${get(RESULT_CODE, out.headers)}].`,
          );
        }
    }

    for (let i = 0; i < nextDto.length; i += 1) {
      const d = nextDto[i];
      // Prepare out ProcessDto for followers
      d.removeRepeater();
      d.removeHeader(RESULT_CODE);

      // Run process on followers
      if (followers.length <= 0) {
        results.push(d);
      } else {
        for (let j = 0; j < followers.length; j += 1) {
          const follower = followers[j];
          const fIndex = this._nodes.findIndex((n) => n.id === follower.id);
          results.push(
            // eslint-disable-next-line no-await-in-loop
            ...await this._recursiveRunner(this._nodes[fIndex], this._cloneProcessDto(d), prefix),
          );
        }
      }
    }

    return results;
  }

  private async _processAction(
    worker: ICommonNode,
    node: TestNode,
    dto: ProcessDto,
    prefix: string,
    index = 0,
  ): Promise<ProcessDto> {
    const spy = mockNodeCurl(
      worker,
      this._file,
      this._container.get(CoreServices.CURL),
      `${prefix}${node.id}`,
      index,
      this._forceMock,
      this._excludeList,
    );
    const out = await worker.processAction(dto);
    spy?.mockRestore();

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

  private _pushMultiple(nextDto: ProcessDto[], out: ProcessDto): void {
    (out.jsonData as Array<Record<string, undefined>>).forEach((item) => {
      nextDto.push(this._cloneProcessDto(out, item));
    });

    if ((out.jsonData as unknown[])?.length <= 0) {
      nextDto.push(out);
    }
  }
}
