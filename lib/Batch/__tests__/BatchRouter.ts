import { Application } from 'express';
import supertest from 'supertest';
import CommonLoader from '../../Commons/CommonLoader';
import BatchRouter from '../BatchRouter';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';

const container = getTestContainer();
const batch = container.getBatch('testbatch');

describe('Tests for BatchRouter', () => {
  it('get /batch/:name/action', async () => {
    const batchUrl = `/batch/${batch.getName()}/action`;
    await supertest(expressApp)
      .post(batchUrl)
      .expect(200, '{dataTest: testValue}');
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
    const postFn = jest.fn();
    const getFn = jest.fn();
    const routeMock = {
      post: postFn,
      get: getFn,
    };

    const routeFn = jest.fn()
      .mockReturnValue(routeMock);
    const expressMock = {
      route: routeFn,
      address: jest.fn(),
      listen: jest.fn(),
    } as never as Application;

    const loaderMock = {
      get: jest.fn(),
      getList: jest.fn(),
    } as never as CommonLoader;

    const router = new BatchRouter(expressMock, loaderMock);
    expect(routeFn)
      .toBeCalledTimes(3);
    expect(getFn)
      .toBeCalledTimes(2);
    expect(postFn)
      .toBeCalledTimes(1);
    expect(router.getName())
      .toEqual('BatchRouter');
  });
});
