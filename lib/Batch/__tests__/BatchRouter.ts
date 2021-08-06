import supertest from 'supertest';
import BatchRouter from '../BatchRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { Logger } from '../../Logger/Logger';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const container = getTestContainer();
const batch = container.getBatch('testbatch');

describe('Tests for BatchRouter', () => {
  /* eslint-disable @typescript-eslint/naming-convention */
  Logger.ctxFromDto = jest.fn().mockReturnValue({
    node_id: '1',
    correlation_id: '1',
    process_id: '1',
    parent_id: '1',
    sequence_id: '1',
  });
  /* eslint-enable @typescript-eslint/naming-convention */

  it('get /batch/:name/action', async () => {
    const batchUrl = `/batch/${batch.getName()}/action`;
    await supertest(expressApp)
      .post(batchUrl)
      .expect(200, '[{"dataTest":"testValue"}]');
  });

  it('get /batch/:name/action/test route', async () => {
    const batchUrl = `/batch/${batch.getName()}/action/test`;
    await supertest(expressApp)
      .get(batchUrl)
      .expect(200, '[]');
  });

  it('get /batch/list route', async () => {
    await supertest(expressApp)
      .get('/batch/list')
      .expect(200, '["testbatch"]');
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
