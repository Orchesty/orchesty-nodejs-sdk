import { getTestContainer, mockedFetch } from '../../../../test/TestAbstact';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import Metrics from '../../../Metrics/Metrics';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import ProcessDto from '../../../Utils/ProcessDto';
import HttpMethods from '../../HttpMethods';
import CurlSender from '../CurlSender';
import RequestDto from '../RequestDto';

let container: DIContainer;
let curlSender: CurlSender;

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    log: () => jest.fn(),
    ctxFromDto: () => jest.fn(),
    createCtx: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('tests for curlSender', () => {
    beforeAll(async () => {
        container = await getTestContainer();
        curlSender = container.get(CoreServices.CURL);
    });

    afterEach(() => {
        mockedFetch.reset();
        mockedFetch.restore();
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('should test send', async () => {
        const url = 'http://testUrl.com/status';
        mockedFetch.get(
            url,
            JSON.stringify({ id: '1' }),
        );
        const response = await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()));
        expect((response.getJsonBody() as { id: string }).id).toBe('1');
    });

    it('should test send - 400', async () => {
        const url = 'http://testUrl.com/status';
        mockedFetch.get(url, 400);
        const response = await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()));
        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 and only 200 is allowed', async () => {
        const url = 'http://testUrl.com/status';
        mockedFetch.get(url, 400);
        try {
            await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()), [200]);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('should test send - body', async () => {
        const url = 'http://testUrl.com/status';
        mockedFetch.post(url, 200);
        try {
            await curlSender.send(
                new RequestDto(url, HttpMethods.POST, new ProcessDto(), JSON.stringify({ message: 'ok' })),
            );
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});
