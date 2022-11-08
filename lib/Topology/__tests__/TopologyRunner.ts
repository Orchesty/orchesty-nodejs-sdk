import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { container } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';
import { initiateContainer } from '../../index';
import Metrics from '../../Metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import ProcessDto from '../../Utils/ProcessDto';
import TopologyRunner from '../TopologyRunner';

function mockCurl(url: string, headers?: Record<string, string>): MockAdapter {
    return new MockAdapter(axios, { onNoMatch: 'throwException' })
        .onPost(url).replyOnce(200, Buffer.from(''), headers);
}

describe('TopologyRunner tests', () => {
    let runner: TopologyRunner;

    beforeAll(async () => {
        await initiateContainer();
    });

    beforeEach(() => {
        runner = container.get(CoreServices.TOPOLOGY_RUNNER);
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('get webhook url', () => {
        const whUrl = TopologyRunner.getWebhookUrl('topoName', 'nodeName', 'hash');
        expect(whUrl).toEqual('https://sp.orchesty.com/topologies/topoName/nodes/nodeName/token/hash/run');
    });

    it('run by name', async () => {
        const mockAdapter = mockCurl('https://sp.orchesty.com/topologies/topoName/nodes/nodeName/run-by-name');
        const res = await runner.runByName({}, 'topoName', 'nodeName', new ProcessDto());

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        mockAdapter.restore();
    });

    it('run by name with custom headers', async () => {
        const header = { header: '123' };
        const mockAdapter = mockCurl('https://sp.orchesty.com/topologies/topoName/nodes/nodeName/run-by-name', header);
        const res = await runner.runByName(
            {},
            'topoName',
            'nodeName',
            new ProcessDto(),
            undefined,
            header,
        );

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        mockAdapter.restore();
    });

    it('run by name with user', async () => {
        const mockAdapter = mockCurl('https://sp.orchesty.com/topologies/topoName/nodes/nodeName/user/user/run-by-name');
        const res = await runner.runByName({}, 'topoName', 'nodeName', new ProcessDto(), 'user');

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        mockAdapter.restore();
    });

    it('run by id', async () => {
        const mockAdapter = mockCurl('https://sp.orchesty.com/topologies/topoId/nodes/nodeId/run');
        const res = await runner.runById({}, 'topoId', 'nodeId', new ProcessDto());

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        mockAdapter.restore();
    });

    it('run by id with user', async () => {
        const mockAdapter = mockCurl('https://sp.orchesty.com/topologies/topoId/nodes/nodeId/user/user/run');
        const res = await runner.runById({}, 'topoId', 'nodeId', new ProcessDto(), 'user');

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        mockAdapter.restore();
    });
});
