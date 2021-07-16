// eslint-disable-next-line max-classes-per-file
import * as fs from 'fs';
import { parse } from 'fast-xml-parser/src/parser';
import path from 'path';
import { Headers } from 'node-fetch';
import ProcessDto from '../../lib/Utils/ProcessDto';
import DIContainer from '../../lib/DIContainer/Container';
import { ICommonNode } from '../../lib/Commons/ICommonNode';
import CoreServices from '../../lib/DIContainer/CoreServices';
import SpyInstance = jest.SpyInstance;
import ResponseDto from '../../lib/Transport/Curl/ResponseDto';
import AConnector from '../../lib/Connector/AConnector';
import {
  FORCE_TARGET_QUEUE, get, RESULT_CODE, WORKER_FOLLOWERS,
} from '../../lib/Utils/Headers';
import ResultCode from '../../lib/Utils/ResultCode';
import RequestDto from '../../lib/Transport/Curl/RequestDto';

interface ICurlMock {
  body: Record<string, unknown>,
  code: number,
  http: string,
  headers: { [key: string]: string },
}

export interface ILightNode {
  name: string,
  id: string,
}

export class TestNode implements ILightNode {
  id: string;

  name: string;

  type: string;

  previous: ILightNode[] = [];

  followers: ILightNode[] = [];

  constructor(id: string, name: string, type: string) {
    this.id = id;
    this.name = name;
    this.type = type;
  }

  public toWorkerFollowerHeader(): {id: string; name: string}[] {
    const res: {id: string; name: string}[] = [];
    this.followers.forEach((f) => res.push({ id: f.id, name: f.name }));

    return res;
  }

  public reduceFollowersByHeader(forceTargetQueue: string): ILightNode[] {
    return this.followers.filter((f) => f.id === forceTargetQueue);
  }
}

export class TopologyTester {
  private _nodes: TestNode[] = [];

  constructor(private _container: DIContainer, private _file: string) {
  }

  public async runTopology(topologyName: string, dto: ProcessDto): Promise<ProcessDto[]> {
    // Parse BPMN scheme
    this._nodes = this._parseTopologyFile(topologyName);

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

  private _parseTopologyFile(topologyName: string): TestNode[] {
    const fileName = path.parse(this._file).name;
    const fileDir = path.parse(this._file).dir;

    const buff = fs.readFileSync(`${fileDir}/Data/${fileName}/${topologyName}.tplg`);
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
  }

  private async _recursiveRunner(node: TestNode, dto: ProcessDto): Promise<ProcessDto[]> {
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

    const spy = this._mockCurl(worker);
    const out = await worker.processAction(dto);
    if (spy) {
      spy.mockRestore();
    }

    let { followers } = node;
    const results: ProcessDto[] = [];
    switch (get(RESULT_CODE, out.headers)) {
      // Success end
      case ResultCode.DO_NOT_CONTINUE.toString():
        return results;
      // Re routing
      case ResultCode.FORWARD_TO_TARGET_QUEUE.toString():
        followers = node.reduceFollowersByHeader(get(FORCE_TARGET_QUEUE, out.headers) ?? '');
        break;
        // TODO: add statuscode for repeater
        // TODO: add statuscode for batch cursor with followers
        // TODO: add statuscode for batch cursor only
      default:
        if (get(RESULT_CODE, out.headers) !== '0') {
          throw new Error(
            `Node [${node.name}] has returned non success result code [${get(RESULT_CODE, out.headers)}].`,
          );
        }
    }

    // Prepare out ProcessDto for followers
    out.removeRepeater();
    out.addHeader(WORKER_FOLLOWERS, JSON.stringify(node.toWorkerFollowerHeader()));

    // Run process on followers
    if (followers.length <= 0) {
      results.push(out);
    } else {
      await Promise.all(
        followers.map(async (follower) => {
          const fIndex = this._nodes.findIndex((n) => n.id === follower.id);
          results.push(
            ...await this._recursiveRunner(this._nodes[fIndex], out),
          );
        }),
      );
    }

    return results;
  }

  private _mockCurl(node: ICommonNode|AConnector): SpyInstance | undefined {
    if (Reflect.has(node, 'sender')) {
      const fileName = path.parse(this._file).name;
      const fileDir = path.parse(this._file).dir;
      const curlSender = this._container.get(CoreServices.CURL);
      const curl = JSON.parse(
        // TODO: Limitation: You can only have one node of the same name in the topology !!
        fs.readFileSync(`${fileDir}/Data/${fileName}/${node.getName()}Mock.json`).toString(),
      ) as ICurlMock;

      return jest.spyOn(curlSender, 'send')
        .mockImplementation(
          (r) => {
            const request = r as RequestDto;
            const [method, url] = curl.http.split(' ', 2);
            expect(request.method).toBe(method);
            expect(request.url).toBe(url);

            return new ResponseDto(
              JSON.stringify(curl.body || {}),
              curl.code || 200,
              new Headers(curl.headers || new Headers()),
            );
          },
        );
    }
    return undefined;
  }
}
