import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getTestContainer } from '../../../../test/TestAbstact';
import DIContainer from '../../../DIContainer/Container';
import ProcessDto from '../../../Utils/ProcessDto';
import { HttpMethods } from '../../HttpMethods';
import CurlSender from '../CurlSender';
import RequestDto from '../RequestDto';

let container: DIContainer;
let curlSender: CurlSender;
let mockAdapter: MockAdapter;

describe('tests for curlSender', () => {
    beforeAll(() => {
        mockAdapter = new MockAdapter(axios);
        container = getTestContainer();
        curlSender = container.get(CurlSender);
    });

    it('should test send', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(200, JSON.stringify({ id: '1' }));
        const response = await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()));

        expect((response.getJsonBody() as { id: string }).id).toBe('1');
    });

    it('should test send - 400 number', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()), 400);

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 obj', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(
            new RequestDto(url, HttpMethods.GET, new ProcessDto()),
            { success: 400 },
        );

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 obj range', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(
            new RequestDto(url, HttpMethods.GET, new ProcessDto()),
            { success: '400-401' },
        );

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 obj ltgt', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(
            new RequestDto(url, HttpMethods.GET, new ProcessDto()),
            { success: '>=400' },
        );

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 obj gteq', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(
            new RequestDto(url, HttpMethods.GET, new ProcessDto()),
            { success: '<=401' },
        );

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 obj lt', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(
            new RequestDto(url, HttpMethods.GET, new ProcessDto()),
            { success: '<401' },
        );

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 obj gt', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400, '');
        const response = await curlSender.send(
            new RequestDto(url, HttpMethods.GET, new ProcessDto()),
            { success: '>399' },
        );

        expect(response.getResponseCode()).toBe(400);
    });

    it('should test send - 400 and only 200 is allowed', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onGet(url).replyOnce(400);
        try {
            await curlSender.send(new RequestDto(url, HttpMethods.GET, new ProcessDto()), [200]);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('should test send - body', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onPost(url).replyOnce(200);
        try {
            await curlSender.send(
                new RequestDto(url, HttpMethods.POST, new ProcessDto(), JSON.stringify({ message: 'ok' })),
            );
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('should test exception', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onPost(url).networkError();
        try {
            await curlSender.send(
                new RequestDto(url, HttpMethods.POST, new ProcessDto(), JSON.stringify({ message: 'ok' })),
            );
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('should test timeout', async () => {
        const url = 'https://testUrl.com/status';
        mockAdapter.onPost(url).timeout();
        try {
            await curlSender.send(
                new RequestDto(url, HttpMethods.POST, new ProcessDto(), JSON.stringify({ message: 'ok' })),
            );
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});
