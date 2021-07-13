import CustomNodeRouter from '../CustomNodeRouter';
import { mockRouter } from '../../../test/TestAbstact';

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
});
