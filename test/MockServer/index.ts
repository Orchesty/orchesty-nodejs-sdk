import axios from 'axios';
import MockAdapter, { RequestHandler } from 'axios-mock-adapter';
import CoreFormsEnum from '../../lib/Application/Base/CoreFormsEnum';
import { CLIENT_ID, FRONTEND_REDIRECT_URL } from '../../lib/Authorization/Type/OAuth2/IOAuth2Application';
import { metricsOptions, orchestyOptions } from '../../lib/Config/Config';
import { HttpMethods } from '../../lib/Transport/HttpMethods';
import { NAME, USER } from '../TestAbstact';

export interface IRequestMock {
    headers?: Record<string, string>;
    body?: string;
    method: HttpMethods;
    url: RegExp | string;
}

export interface IResponseMock {
    body?: Buffer | unknown[];
    headers?: Record<string, unknown>;
    code?: number;
}

export interface IMockServer {
    request: IRequestMock;
    response: IResponseMock;
}

export const nodeConfig = {
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
        enabled: true,
        hops: 2,
        interval: 30,
    },
    id: '1',
};

export const appInstallConfig = {
    expires: new Date(3000, 1, 1),
    user: USER,
    key: NAME,
    settings: {
        [CoreFormsEnum.AUTHORIZATION_FORM]: {
            [CLIENT_ID]: 'client id 1',
            [FRONTEND_REDIRECT_URL]: 'url',
        },
    },
    enabled: false,
    created: new Date(2022, 11, 5),
    updated: new Date(2022, 11, 6),
    encryptedSettings: '',
    nonEncryptedSettings: '',
};

export const webhookConfig = {
    name: 'testWebhook',
    user: USER,
    token: '',
    node: '',
    topology: 'testWebhook',
    application: 'webhookName',
    webhookId: '',
    unsubscribeFailed: false,
};

export const mockAdapter = new MockAdapter(axios);

export function mockOnce(mocks: IMockServer[] = []): void {
    mocks.forEach((mock) => {
        let mockHandler: RequestHandler;
        switch (mock.request.method) {
            case HttpMethods.GET:
                mockHandler = mockAdapter.onGet(mock.request.url, mock.request.body, mock.request.headers);
                break;
            case HttpMethods.POST:
                mockHandler = mockAdapter.onPost(mock.request.url, mock.request.body, mock.request.headers);
                break;
            case HttpMethods.PUT:
                mockHandler = mockAdapter.onPut(mock.request.url, mock.request.body, mock.request.headers);
                break;
            case HttpMethods.DELETE:
                mockHandler = mockAdapter.onDelete(mock.request.url, mock.request.body, mock.request.headers);
                break;
            case HttpMethods.PATCH:
                mockHandler = mockAdapter.onPatch(mock.request.url, mock.request.body, mock.request.headers);
                break;
            default:
                throw Error(`Unsupported method ${mock.request.url}`);
        }

        mockHandler.replyOnce(
            mock.response.code ?? 200,
            mock.response.body ?? {},
            mock.request.headers ?? {},
        );
    });
}

export function createLoggerMockedServer(mocks: IMockServer[] = []): MockAdapter {
    mockOnce(mocks);

    if (!mocks.length) {
        mockAdapter.onPost(`${orchestyOptions.workerApi}/logger/logs`).reply(200);
    }

    return mockAdapter;
}

export function createMetricsMockedServer(mocks: IMockServer[] = []): MockAdapter {
    mockOnce(mocks);

    if (!mocks.length) {
        mockAdapter.onPost(`${orchestyOptions.workerApi}/metrics/${metricsOptions.processMeasurement}`).reply(200);
        mockAdapter.onPost(`${orchestyOptions.workerApi}/metrics/${metricsOptions.curlMeasurement}`).reply(200);
    }

    return mockAdapter;
}

export function createDocumentMockedServer(mocks: IMockServer[] = []): MockAdapter {
    if (!mocks.length) {
        mockAdapter.onGet(`${orchestyOptions.workerApi}/document/Node`).replyOnce(200, [{ id: '1', systemConfigs: JSON.stringify(nodeConfig) }]);
        mockAdapter.onGet(`${orchestyOptions.workerApi}/document/Webhook`).replyOnce(200, [webhookConfig]);
        mockAdapter.onGet(new RegExp(`${orchestyOptions.workerApi}/document/ApplicationInstall`)).replyOnce(200, [appInstallConfig]);
        mockAdapter.onPost(new RegExp(`${orchestyOptions.workerApi}/document/*`)).replyOnce(201);
        mockAdapter.onDelete(new RegExp(`${orchestyOptions.workerApi}/document/*`)).replyOnce(204);
    }

    return mockAdapter;
}
