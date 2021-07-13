import ConnectorRouter from '../ConnectorRouter';
import { mockRouter } from '../../../test/TestAbstact';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test ConnectorRouter', () => {
  it('test configureRoutes', () => {
    const mock = mockRouter();
    const router = new ConnectorRouter(mock.express, mock.loader);
    expect(mock.routeFn).toBeCalledTimes(5);
    expect(mock.getFn).toBeCalledTimes(3);
    expect(mock.postFn).toBeCalledTimes(2);
    expect(router.getName()).toEqual('ConnectorRouter');
  });
});
