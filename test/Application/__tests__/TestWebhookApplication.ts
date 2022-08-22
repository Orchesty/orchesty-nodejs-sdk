import { Headers } from 'node-fetch';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import WebhookSubscription from '../../../lib/Application/Model/Webhook/WebhookSubscription';
import RequestDto from '../../../lib/Transport/Curl/RequestDto';
import ResponseDto from '../../../lib/Transport/Curl/ResponseDto';
import { HttpMethods } from '../../../lib/Transport/HttpMethods';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import TestWebhookApplication from '../TestWebhookApplication';

let app: TestWebhookApplication;

describe('Tests for webhook application', () => {
    beforeEach(() => {
        app = new TestWebhookApplication();
    });

    it('getRequestDto', () => {
        const urlValue = 'https://www.google.com';
        const data = JSON.stringify({ test: 'testData' });
        const method = HttpMethods.POST;
        const requestDto = app.getRequestDto(new ProcessDto(), new ApplicationInstall(), method, urlValue, data);
        expect(requestDto).toBeInstanceOf(RequestDto);
        expect(requestDto).toHaveProperty('url', urlValue);
        expect(requestDto).toHaveProperty('method', method);
        expect(requestDto).toHaveProperty('body', data);

        const requestDtoWithoutUrl = app.getRequestDto(new ProcessDto(), new ApplicationInstall(), method);
        expect(requestDtoWithoutUrl).toHaveProperty('url', '');
    });

    it('getSettingsForm', () => {
        const expected = {
            forms: [
                {
                    description: '',
                    fields: [
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'testKey',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'password',
                            value: null,
                        },
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'person',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'text',
                            value: null,
                        },
                    ],
                    key: 'testKey',
                    publicName: 'testPublicName',
                },
            ],
        };
        expect(app.getFormStack()).toEqual(expected);
    });

    it('getWebhookSubscribeRequestDto', () => {
        const subscription = new WebhookSubscription('SubName', 'SubNode', 'SubTopology');
        const urlValue = 'https://www.google.com';
        const requestDto = app.getWebhookSubscribeRequestDto(new ApplicationInstall(), subscription, urlValue);
        expect(requestDto).toBeInstanceOf(RequestDto);
        expect(requestDto).toHaveProperty('url', urlValue);
        expect(requestDto).toHaveProperty('method', HttpMethods.GET);
    });

    it('getWebhookUnsubscribeRequestDto', () => {
        const requestDto = app.getWebhookUnsubscribeRequestDto(new ApplicationInstall(), '1');
        expect(requestDto).toBeInstanceOf(RequestDto);
        expect(requestDto).toHaveProperty('url', 'unknown/url');
        expect(requestDto).toHaveProperty('method', HttpMethods.DELETE);
    });

    it('processWebhookSubscribeResponse', () => {
        const processResponse = app.processWebhookSubscribeResponse(new ResponseDto(
            JSON.stringify({ id: '1' }),
            200,
            new Headers(),
        ), new ApplicationInstall());
        expect(processResponse).toBe('1');
    });

    it('processWebhookUnsubscribeResponse', () => {
        const processResponse = app.processWebhookUnsubscribeResponse(new ResponseDto(
            JSON.stringify({ id: '1' }),
            200,
            new Headers(),
        ));
        expect(processResponse).toBeTruthy();
    });
});
