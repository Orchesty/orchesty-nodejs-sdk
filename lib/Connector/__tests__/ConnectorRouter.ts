import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { mockOnce } from '../../../test/MockServer';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { ICommonNode } from '../../Commons/ICommonNode';
import DIContainer from '../../DIContainer/Container';
import { HttpMethods } from '../../Transport/HttpMethods';
import ConnectorRouter from '../ConnectorRouter';

function mockConnector(count: number): void {
    for (let i = 0; i < count; i++) {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: 'https://jsonplaceholder.typicode.com/users',
            },
            response: {
                body: Buffer.from(JSON.stringify({ response: 'mockedResponse' })),
                headers: { 'result-code': '0', 'result-message': 'Processed successfully.' },
            },
        }]);
    }
}

describe('Test ConnectorRouter', () => {
    let container: DIContainer;
    let connector: ICommonNode;

    beforeAll(() => {
        container = getTestContainer();
        connector = container.getConnector('test');
    });

    it('get /connector/:name/action/test route', async () => {
        await supertest(expressApp)
            .get(`/connector/${connector.getName()}/action/test`)
            .expect(StatusCodes.OK, '[]');
    });

    it('post /connector/:name/action route', async () => {
        mockConnector(3);

        await supertest(expressApp)
            .post(`/connector/${connector.getName()}/action`)
            .send(JSON.stringify({ headers: { user: 'test' }, body: { foo: 'bar' } }))
            .expect(StatusCodes.OK, {
                body: JSON.stringify({ response: 'mockedResponse' }),
                headers: { 'result-code': '0', 'result-message': 'Processed successfully.', user: 'test' },
            });
    });

    it('get /connector/list route', async () => {
        await supertest(expressApp)
            .get('/connector/list')
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
