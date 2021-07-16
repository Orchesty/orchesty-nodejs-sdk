import supertest from 'supertest';
import BatchRouter from '../BatchRouter';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';

const container = getTestContainer();
const batch = container.getBatch('testbatch');

describe('Tests for BatchRouter', () => {
  it('get /batch/:name/action', async () => {
    const batchUrl = `/batch/${batch.getName()}/action`;
    await supertest(expressApp)
      .post(batchUrl)
      .expect(200, '{"dataTest":"testValue"}');
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
