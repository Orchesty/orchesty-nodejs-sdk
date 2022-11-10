import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import BatchRouter from '../BatchRouter';
import { IBatchNode } from '../IBatchNode';

describe('Tests for BatchRouter', () => {
    let container: DIContainer;
    let batch: IBatchNode;

    beforeAll(async () => {
        container = await getTestContainer();
        batch = container.getBatch('testbatch');
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
    });

    it('get /batch/:name/action', async () => {
        const batchUrl = `/batch/${batch.getName()}/action`;
        await supertest(expressApp)
            .post(batchUrl)
            .expect(StatusCodes.OK, JSON.stringify({
                body: JSON.stringify([{ headers: {}, body: JSON.stringify({ dataTest: 'testValue' }) }]),
                headers: {
                    cursor: 'testCursor',
                    'result-message': 'Message will be used as a iterator with cursor [testCursor]. Data will be send to follower(s).',
                    'result-code': '1010',
                },
            }));
    });

    it('get /batch/:name/action/test route', async () => {
        const batchUrl = `/batch/${batch.getName()}/action/test`;
        await supertest(expressApp)
            .get(batchUrl)
            .expect(StatusCodes.OK, '[]');
    });

    it('get /batch/list route', async () => {
        await supertest(expressApp)
            .get('/batch/list')
            .expect(StatusCodes.OK, '[{"name":"testbatch"}]');
    });

    it('test configureRoutes', () => {
        const mock = mockRouter();
        const router = new BatchRouter(mock.express, mock.loader);
        expect(mock.routeFn).toHaveBeenCalledTimes(3);
        expect(mock.getFn).toHaveBeenCalledTimes(2);
        expect(mock.postFn).toHaveBeenCalledTimes(1);
        expect(router.getName()).toEqual('BatchRouter');
    });
});
