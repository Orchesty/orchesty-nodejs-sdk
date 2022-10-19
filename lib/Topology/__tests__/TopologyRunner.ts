import deepmerge from 'deepmerge';
import { StatusCodes } from 'http-status-codes';
import { Headers, HeadersInit } from 'node-fetch';
import { container } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';
import { initiateContainer } from '../../index';
import Metrics from '../../Metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import RequestDto from '../../Transport/Curl/RequestDto';
import ResponseDto from '../../Transport/Curl/ResponseDto';
import { HttpMethods } from '../../Transport/HttpMethods';
import ProcessDto from '../../Utils/ProcessDto';
import TopologyRunner from '../TopologyRunner';
import SpyInstance = jest.SpyInstance;

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

function mockCurl(curl: CurlSender, url: string, headers?: HeadersInit): SpyInstance {
    return jest.spyOn(curl, 'send').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (r: RequestDto): Promise<ResponseDto> => {
            const request = r;
            expect(request.getMethod()).toBe(HttpMethods.POST);
            expect(request.getUrl()).toBe(url);
            const defaultHeaders = {
                'previous-correlation-id': '',
                'previous-node-id': '',
                'orchesty-api-key': '',
            };

            if (headers) {
                expect(request.getHeaders())
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .toStrictEqual(new Headers(deepmerge(defaultHeaders as any, headers as any)));
            } else {
                expect(request.getHeaders()).toStrictEqual(new Headers(defaultHeaders));
            }

            return new ResponseDto('{}', StatusCodes.OK, new Headers(new Headers()), Buffer.from(''));
        },
    );
}

describe('TopologyRunner tests', () => {
    let curl: CurlSender;
    let runner: TopologyRunner;

    beforeAll(async () => {
        await initiateContainer();
    });

    beforeEach(() => {
        curl = container.get(CoreServices.CURL);
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
        const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoName/nodes/nodeName/run-by-name');
        const res = await runner.runByName({}, 'topoName', 'nodeName', new ProcessDto());

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        sender.mockRestore();
    });

    it('run by name with custom headers', async () => {
        const header = { header: '123' };
        const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoName/nodes/nodeName/run-by-name', header);
        const res = await runner.runByName(
            {},
            'topoName',
            'nodeName',
            new ProcessDto(),
            undefined,
            header,
        );

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        sender.mockRestore();
    });

    it('run by name with user', async () => {
        const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoName/nodes/nodeName/user/user/run-by-name');
        const res = await runner.runByName({}, 'topoName', 'nodeName', new ProcessDto(), 'user');

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        sender.mockRestore();
    });

    it('run by id', async () => {
        const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoId/nodes/nodeId/run');
        const res = await runner.runById({}, 'topoId', 'nodeId', new ProcessDto());

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        sender.mockRestore();
    });

    it('run by id with user', async () => {
        const sender = mockCurl(curl, 'https://sp.orchesty.com/topologies/topoId/nodes/nodeId/user/user/run');
        const res = await runner.runById({}, 'topoId', 'nodeId', new ProcessDto(), 'user');

        expect(res.getResponseCode()).toEqual(StatusCodes.OK);
        sender.mockRestore();
    });
});
