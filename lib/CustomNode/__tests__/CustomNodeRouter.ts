import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { createDocumentMockedServer, mockOnce, nodeConfig } from '../../../test/MockServer';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { ICommonNode } from '../../Commons/ICommonNode';
import { orchestyOptions } from '../../Config/Config';
import DIContainer from '../../DIContainer/Container';
import errorHandler from '../../Middleware/ErrorHandler';
import Node from '../../Storage/Database/Document/Node';
import { HttpMethods } from '../../Transport/HttpMethods';
import { REPEAT_INTERVAL, REPEAT_MAX_HOPS } from '../../Utils/Headers';
import CustomNodeRouter from '../CustomNodeRouter';

describe('Test CustomNodeRouter', () => {
    let container: DIContainer;
    let customNode: ICommonNode;
    let testOnRepeatExceptionCustom: ICommonNode;

    beforeAll(() => {
        container = getTestContainer();
        customNode = container.getCustomNode('testcustom');
        testOnRepeatExceptionCustom = container.getCustomNode('testOnRepeatExceptionCustom');
        expressApp.use(errorHandler(container.getRepository(Node)));
    });

    beforeEach(() => {
        createDocumentMockedServer();
    });

    it('test configureRoutes', () => {
        const mock = mockRouter();
        const router = new CustomNodeRouter(mock.express, mock.loader);

        expect(mock.routeFn).toHaveBeenCalledTimes(3);
        expect(mock.getFn).toHaveBeenCalledTimes(2);
        expect(mock.postFn).toHaveBeenCalledTimes(1);
        expect(router.getName()).toEqual('CustomNodeRouter');
    });

    it('get /custom-node/list route', async () => {
        const customNodeUrl = '/custom-node/list';
        await supertest(expressApp)
            .get(customNodeUrl)
            .expect(StatusCodes.OK, '[{"name":"test-mapper"},{"name":"testcustom"},{"name":"testOnRepeatExceptionCustom"}]');
    });

    it('get /custom-node/:name/process/test route', async () => {
        const customNodeUrl = `/custom-node/${customNode.getName()}/process/test`;
        await supertest(expressApp)
            .get(customNodeUrl)
            .expect(StatusCodes.OK, '[]');
    });

    it('post /custom-node/:name/process route', async () => {
        const customNodeUrl = `/custom-node/${customNode.getName()}/process`;
        const res = await supertest(expressApp)
            .post(customNodeUrl);

        const resBody = JSON.parse(res.body.body);
        const exp = {
            body: JSON.stringify({ test: 'custom', inner: { date: resBody.inner.date, one: 2 } }),
            headers: {
                'result-code': '0',
                'result-message': 'Processed successfully.',
            },
        };

        expect(res.body.body).toEqual(exp.body);
    });

    it('post /custom-node/:name/process route - onRepeatException', async () => {
        const onRepeatExceptionCustomNodeUrl = `/custom-node/${testOnRepeatExceptionCustom.getName()}/process`;
        const resp = await supertest(expressApp)
            .post(onRepeatExceptionCustomNodeUrl)
            .send(JSON.stringify({
                headers: {
                    'node-id': '',
                },
                body: {},
            }));

        expect(resp.status).toBe(200);
        expect(resp.body.headers[REPEAT_INTERVAL]).toBe('30');
        expect(resp.body.headers[REPEAT_MAX_HOPS]).toBe('2');
    });

    it('post /custom-node/:name/process route - onRepeatException, custom repeater', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/Node?filter={"ids":["1"]}`,
            },
            response: { body: [{ id: '1', systemConfigs: JSON.stringify(nodeConfig) }] },
        }]);

        const onRepeatExceptionCustomNodeUrl = `/custom-node/${testOnRepeatExceptionCustom.getName()}/process`;
        const resp = await supertest(expressApp)
            .post(onRepeatExceptionCustomNodeUrl)
            .send(JSON.stringify({
                headers: {
                    'node-id': '1',
                },
                body: {},
            }));

        expect(resp.status).toBe(200);
        expect(resp.body.headers[REPEAT_INTERVAL]).toBe('30');
        expect(resp.body.headers[REPEAT_MAX_HOPS]).toBe('2');
    });
});
