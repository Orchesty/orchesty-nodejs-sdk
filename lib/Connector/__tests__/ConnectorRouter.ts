import supertest from 'supertest';
import ConnectorRouter from '../ConnectorRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';

const container = getTestContainer();
const connector = container.getConnector('test');

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test ConnectorRouter', () => {
  it('get /connector/:name/action/test route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/action/test`;
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200, '[]');
  });

  it('get /connector/list route', async () => {
    const connectorUrl = '/connector/list';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200, '["test"]');
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
