import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { ICommonNode } from '../../Commons/ICommonNode';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import ConnectorRouter from '../ConnectorRouter';

jest.mock('../../Transport/Curl/CurlSender', () => jest.fn().mockImplementation(() => ({
    send: () => ({ getResponseCode: () => StatusCodes.OK, getBody: () => ({ response: 'mockedResponse' }) }),
})));

describe('Test ConnectorRouter', () => {
    let container: DIContainer;
    let connector: ICommonNode;

    beforeAll(async () => {
        container = await getTestContainer();
        connector = container.getConnector('test');
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
    });

    it('get /connector/:name/action/test route', async () => {
        const connectorUrl = `/connector/${connector.getName()}/action/test`;
        await supertest(expressApp)
            .get(connectorUrl)
            .expect(StatusCodes.OK, '[]');
    });

    it('post /connector/:name/action route', async () => {
        const connectorUrl = `/connector/${connector.getName()}/action`;
        await supertest(expressApp)
            .post(connectorUrl)
            .expect(StatusCodes.OK, {
                body: { response: 'mockedResponse' },
                headers: { 'result-code': '0', 'result-message': 'Processed successfully.' },
            });
    });

    it('get /connector/list route', async () => {
        const connectorUrl = '/connector/list';
        await supertest(expressApp)
            .get(connectorUrl)
            .expect(StatusCodes.OK, '[{"name":"test"}]');
    });

    it('test configureRoutes', () => {
        const mock = mockRouter();
        const router = new ConnectorRouter(mock.express, mock.loader);
        expect(mock.routeFn).toHaveBeenCalledTimes(3);
        expect(mock.getFn).toHaveBeenCalledTimes(2);
        expect(mock.postFn).toHaveBeenCalledTimes(1);
        expect(router.getName()).toEqual('ConnectorRouter');
    });
});
