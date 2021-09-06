import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import CustomNodeRouter from '../CustomNodeRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { Logger } from '../../Logger/Logger';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Metrics from '../../Metrics/Metrics';

const container = getTestContainer();
const customNode = container.getCustomNode('testcustom');
// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test CustomNodeRouter', () => {
  /* eslint-disable @typescript-eslint/naming-convention */
  Logger.ctxFromDto = jest.fn().mockReturnValue({
    node_id: '1',
    correlation_id: '1',
    process_id: '1',
    parent_id: '1',
    sequence_id: '1',
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('test configureRoutes', () => {
    const mock = mockRouter();
    const router = new CustomNodeRouter(mock.express, mock.loader);
    expect(mock.routeFn).toBeCalledTimes(3);
    expect(mock.getFn).toBeCalledTimes(2);
    expect(mock.postFn).toBeCalledTimes(1);
    expect(router.getName()).toEqual('CustomNodeRouter');
  });

  it('get /custom-node/list route', async () => {
    const customNodeUrl = '/custom-node/list';
    await supertest(expressApp)
      .get(customNodeUrl)
      .expect(StatusCodes.OK, '["testcustom"]');
  });

  it('get /custom-node/:name/process/test route', async () => {
    const customNodeUrl = `/custom-node/${customNode.getName()}/process/test`;
    await supertest(expressApp)
      .get(customNodeUrl)
      .expect(StatusCodes.OK, '[]');
  });

  it('post /custom-node/:name/process route', () => {
    const customNodeUrl = `/custom-node/${customNode.getName()}/process`;
    supertest(expressApp)
      .post(customNodeUrl)
      .expect(StatusCodes.OK, (err: any, res) => {
        expect(err === null).toBeTruthy();
        const jsonData = JSON.parse(res.text);
        expect(jsonData).toEqual({ test: 'custom', inner: { one: 2, date: jsonData.inner?.date } });
      });
  });
});
