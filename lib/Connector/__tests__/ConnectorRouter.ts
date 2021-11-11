import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import ConnectorRouter from '../ConnectorRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Metrics from '../../Metrics/Metrics';
import DIContainer from '../../DIContainer/Container';
import { ICommonNode } from '../../Commons/ICommonNode';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  info: () => jest.fn(),
  log: () => jest.fn(),
  ctxFromDto: () => jest.fn(),
  ctxFromReq: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../Transport/Curl/CurlSender', () => jest.fn().mockImplementation(() => ({
  send: () => ({ responseCode: StatusCodes.OK, body: { response: 'mockedResponse' } }),
})));

describe('Test ConnectorRouter', () => {
  let container: DIContainer;
  let connector: ICommonNode;

  beforeAll(async () => {
    container = await getTestContainer();
    connector = container.getConnector('test');
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('get /connector/:name/action/test route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/action/test`;
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK, '[]');
  });

  it('post /connector/:name/action route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/action`;
    await supertest(expressApp)
      .post(connectorUrl)
      .expect(StatusCodes.OK, { response: 'mockedResponse' });
  });

  it('get /connector/list route', async () => {
    const connectorUrl = '/connector/list';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK, '["test"]');
  });

  it('test configureRoutes', () => {
    const mock = mockRouter();
    const router = new ConnectorRouter(mock.express, mock.loader);
    expect(mock.routeFn).toBeCalledTimes(3);
    expect(mock.getFn).toBeCalledTimes(2);
    expect(mock.postFn).toBeCalledTimes(1);
    expect(router.getName()).toEqual('ConnectorRouter');
  });
});
