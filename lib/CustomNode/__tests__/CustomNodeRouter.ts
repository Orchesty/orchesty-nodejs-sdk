import supertest from 'supertest';
import CustomNodeRouter from '../CustomNodeRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { Logger } from '../../Logger/Logger';
import { StatusCodes } from 'http-status-codes';

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

  it('post /custom-node/:name/process route', async () => {
    const customNodeUrl = `/custom-node/${customNode.getName()}/process`;
    const expected = '{"test":"custom"}';
    await supertest(expressApp)
      .post(customNodeUrl)
      .expect(StatusCodes.OK, expected);
  });
});
