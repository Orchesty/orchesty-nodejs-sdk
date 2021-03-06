import { Headers } from 'node-fetch';
import { StatusCodes } from 'http-status-codes';
import CurlSender from '../../Transport/Curl/CurlSender';
import { container } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';
import RequestDto from '../../Transport/Curl/RequestDto';
import ResponseDto from '../../Transport/Curl/ResponseDto';
import HttpMethods from '../../Transport/HttpMethods';
import SpyInstance = jest.SpyInstance;
import TopologyRunner from '../TopologyRunner';
import { initiateContainer } from '../../index';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Metrics from '../../Metrics/Metrics';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

function mockCurl(curl: CurlSender, url: string): SpyInstance {
  return jest.spyOn(curl, 'send').mockImplementation(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (r: RequestDto): Promise<ResponseDto> => {
      const request = r as RequestDto;
      expect(request.method).toBe(HttpMethods.POST);
      expect(request.url).toBe(url);

      return new ResponseDto('{}', StatusCodes.OK, new Headers(new Headers()));
    },
  );
}

describe('TopologyRunner tests', () => {
  let curl: CurlSender;
  let runner: TopologyRunner;

  beforeAll(async () => {
    await initiateContainer();
  });

  beforeEach(() => {
    curl = container.get(CoreServices.CURL);
    runner = container.get(CoreServices.TOPOLOGY_RUNNER);
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('get webhook url', () => {
    const whUrl = TopologyRunner.getWebhookUrl('topoName', 'nodeName', 'hash');
    expect(whUrl).toEqual('https://sp.orchesty.com/topologies/topoName/nodes/nodeName/token/hash/run');
  });

  it('run by name', async () => {
    const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoName/nodes/nodeName/run-by-name');
    const res = await runner.runByName({}, 'topoName', 'nodeName');

    expect(res.responseCode).toEqual(StatusCodes.OK);
    sender.mockRestore();
  });

  it('run by name with user', async () => {
    const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoName/nodes/nodeName/user/user/run-by-name');
    const res = await runner.runByName({}, 'topoName', 'nodeName', 'user');

    expect(res.responseCode).toEqual(StatusCodes.OK);
    sender.mockRestore();
  });

  it('run by id', async () => {
    const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoId/nodes/nodeId/run');
    const res = await runner.runById({}, 'topoId', 'nodeId');

    expect(res.responseCode).toEqual(StatusCodes.OK);
    sender.mockRestore();
  });

  it('run by id with user', async () => {
    const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoId/nodes/nodeId/user/user/run');
    const res = await runner.runById({}, 'topoId', 'nodeId', 'user');

    expect(res.responseCode).toEqual(StatusCodes.OK);
    sender.mockRestore();
  });
});
