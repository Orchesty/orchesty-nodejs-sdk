import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getTestContainer } from '../../../../test/TestAbstact';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import ProcessDto from '../../../Utils/ProcessDto';
import { HttpMethods } from '../../HttpMethods';
import CurlSender from '../CurlSender';
import RequestDto from '../RequestDto';

let container: DIContainer;
let curlSender: CurlSender;
let mockAdapter: MockAdapter;

describe('tests for curlSender', () => {
    beforeAll(async () => {
        mockAdapter = new MockAdapter(axios);
        container = await getTestContainer();
        curlSender = container.get(CoreServices.CURL);
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
    });

    it('should test send', async () => {
        const url = 'http://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(200, JSON.stringify({ id: '1' }));
        const response = await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()));
        expect((response.getJsonBody() as { id: string }).id).toBe('1');
    });

    it('should test send - 400', async () => {
        const url = 'http://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()), [400]);
        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 and only 200 is allowed', async () => {
        const url = 'http://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400);
        try {
            await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()), [200]);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('should test send - body', async () => {
        const url = 'http://testUrl.com/status';
        mockAdapter.onPost(url).replyOnce(200);
        try {
            await curlSender.send(
                new RequestDto(url, HttpMethods.POST, new ProcessDto(), JSON.stringify({ message: 'ok' })),
            );
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});
