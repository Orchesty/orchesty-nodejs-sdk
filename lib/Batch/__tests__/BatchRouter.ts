import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import Metrics from '../../Metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import BatchRouter from '../BatchRouter';
import { IBatchNode } from '../IBatchNode';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  info: () => jest.fn(),
  error: () => jest.fn(),
  debug: () => jest.fn(),
  ctxFromDto: () => jest.fn(),
  ctxFromReq: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Tests for BatchRouter', () => {
  let container: DIContainer;
  let batch: IBatchNode;

  beforeAll(async () => {
    container = await getTestContainer();
    batch = container.getBatch('testbatch');
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('get /batch/:name/action', async () => {
    const batchUrl = `/batch/${batch.getName()}/action`;
    await supertest(expressApp)
      .post(batchUrl)
      .expect(StatusCodes.OK, JSON.stringify({
        body: JSON.stringify([{ headers: null, body: JSON.stringify({ dataTest: 'testValue' }) }]),
        headers: {
          cursor: 'testCursor',
          'result-message':
            'Message will be used as a iterator with cursor [testCursor]. Data will be send to follower(s).',
          'result-code': '1010',
        },
      }));
  });

  it('get /batch/:name/action/test route', async () => {
    const batchUrl = `/batch/${batch.getName()}/action/test`;
    await supertest(expressApp)
      .get(batchUrl)
      .expect(StatusCodes.OK, '[]');
  });

  it('get /batch/list route', async () => {
    await supertest(expressApp)
      .get('/batch/list')
      .expect(StatusCodes.OK, '["testbatch"]');
  });

  it('test configureRoutes', () => {
    const mock = mockRouter();
    const router = new BatchRouter(mock.express, mock.loader);
    expect(mock.routeFn).toBeCalledTimes(3);
    expect(mock.getFn).toBeCalledTimes(2);
    expect(mock.postFn).toBeCalledTimes(1);
    expect(router.getName()).toEqual('BatchRouter');
  });
});
