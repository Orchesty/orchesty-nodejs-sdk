import supertest from 'supertest';
import ConnectorRouter from '../ConnectorRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { Logger } from '../../Logger/Logger';

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

  it('get /connector/:name/action/test route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/action/test`;
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200, '[]');
  });

  it('post /connector/:name/action route', async () => {
    const connectorUrl = `/connector/${connector.getName()}/action`;
    await supertest(expressApp)
      .post(connectorUrl)
      .send({ name: 'john' })
      .expect(200, '{\n  "id": 11\n}');
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
