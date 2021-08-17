import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import ConnectorRouter from '../ConnectorRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { Logger } from '../../Logger/Logger';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Metrics from '../../Metrics/Metrics';

const container = getTestContainer();
const connector = container.getConnector('test');

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../Transport/Curl/CurlSender', () => jest.fn().mockImplementation(() => ({
  send: () => ({ responseCode: StatusCodes.OK, body: { response: 'mockedResponse' } }),
})));

describe('Test ConnectorRouter', () => {
  /* eslint-disable @typescript-eslint/naming-convention */
  Logger.ctxFromDto = jest.fn().mockReturnValue({
    node_id: '1',
    correlation_id: '1',
    process_id: '1',
    parent_id: '1',
    sequence_id: '1',
  });
  /* eslint-enable @typescript-eslint/naming-convention */

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

  it('post /connector/:name/webhook route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/webhook`;
    await supertest(expressApp)
      .post(connectorUrl)
      .expect(StatusCodes.OK, { response: 'mockedResponse' });
  });

  it('get /connector/:name/webhook/test route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/webhook/test`;
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK);
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
    expect(mock.routeFn).toBeCalledTimes(5);
    expect(mock.getFn).toBeCalledTimes(3);
    expect(mock.postFn).toBeCalledTimes(2);
    expect(router.getName()).toEqual('ConnectorRouter');
  });
});
