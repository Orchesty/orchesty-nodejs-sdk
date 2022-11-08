import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import { ICommonNode } from '../../Commons/ICommonNode';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import Metrics from '../../Metrics/Metrics';
import errorHandler from '../../Middleware/ErrorHandler';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Node from '../../Storage/Mongodb/Document/Node';
import NodeRepository from '../../Storage/Mongodb/Document/NodeRepository';
import { REPEAT_INTERVAL, REPEAT_MAX_HOPS } from '../../Utils/Headers';
import CustomNodeRouter from '../CustomNodeRouter';

const config = {
    sdk: {
        host: 'testHost',
    },
    bridge: {
        host: 'testHost',
    },
    rabbit: {
        prefetch: 'tesePrefetch',
    },
    repeater: {
        enabled: false,
        hops: 2,
        interval: 30,
    },
};

describe('Test CustomNodeRouter', () => {
    let container: DIContainer;
    let customNode: ICommonNode;
    let testOnRepeatExceptionCustom: ICommonNode;
    let nodeRepository: NodeRepository;

    beforeAll(async () => {
        container = await getTestContainer();
        customNode = container.getCustomNode('testcustom');
        testOnRepeatExceptionCustom = container.getCustomNode('testOnRepeatExceptionCustom');
        expressApp.use(errorHandler(container.getRepository(Node)));
        nodeRepository = container.getRepository(Node);
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
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
        const node = new Node().setConfigs(config);
        await nodeRepository.insert(node);

        const onRepeatExceptionCustomNodeUrl = `/custom-node/${testOnRepeatExceptionCustom.getName()}/process`;
        const resp = await supertest(expressApp)
            .post(onRepeatExceptionCustomNodeUrl)
            .send(JSON.stringify({
                headers: {
                    'node-id': node.getId(),
                },
                body: {},
            }));
        expect(resp.status).toBe(200);
        expect(resp.body.headers[REPEAT_INTERVAL]).toBe('60');
        expect(resp.body.headers[REPEAT_MAX_HOPS]).toBe('10');
    });

    it('post /custom-node/:name/process route - onRepeatException, custom repeater', async () => {
        const editedConfig = config;
        editedConfig.repeater.enabled = true;
        const node = new Node().setConfigs(editedConfig);
        await nodeRepository.insert(node);

        const onRepeatExceptionCustomNodeUrl = `/custom-node/${testOnRepeatExceptionCustom.getName()}/process`;
        const resp = await supertest(expressApp)
            .post(onRepeatExceptionCustomNodeUrl)
            .send(JSON.stringify({
                headers: {
                    'node-id': node.getId(),
                },
                body: {},
            }));
        expect(resp.status).toBe(200);
        expect(resp.body.headers[REPEAT_INTERVAL]).toBe('30');
        expect(resp.body.headers[REPEAT_MAX_HOPS]).toBe('2');
    });
});
