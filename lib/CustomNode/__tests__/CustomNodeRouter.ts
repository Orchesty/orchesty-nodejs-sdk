import CustomNodeRouter from '../CustomNodeRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import supertest from 'supertest';
const container = getTestContainer();
const customNode = container.getCustomNode('test');
// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test CustomNodeRouter', () => {
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
      .expect(200, '["test"]');
  });

  it('get /custom-node/:name/process/test route', async () => {
    const customNodeUrl = `/custom-node/${customNode.getName()}/process/test`;
    await supertest(expressApp)
      .get(customNodeUrl)
      .expect(200, '[]');
  });

  // Todo : need to be fixed
  it.skip('post /custom-node/:name/process route', async () => {
    const customNodeUrl = `/custom-node/${customNode.getName()}/process`;
    await supertest(expressApp)
      .post(customNodeUrl)
      .expect(200, '[]');
  });
});
