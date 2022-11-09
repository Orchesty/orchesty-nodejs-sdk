import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { loggerOptions, metricsOptions } from '../../lib/Config/Config';

export interface IMockServer {
    url: string;
    resBody: string;
    resCode?: number;
}

export const mockAdapter = new MockAdapter(axios);

export function createLoggerMockedServer(mocks: IMockServer[] = []): MockAdapter {
    mocks.forEach((mock) => {
        mockAdapter.onPost(mock.url).replyOnce(mock.resCode ?? 200, mock.resBody);
    });

    if (!mocks.length) {
        mockAdapter.onPost(`${loggerOptions.logsApi}/logs`).reply(200);
    }

    return mockAdapter;
}

export function createMetricsMockedServer(mocks: IMockServer[] = []): MockAdapter {
    mocks.forEach((mock) => {
        mockAdapter.onPost(mock.url).replyOnce(mock.resCode ?? 200, mock.resBody);
    });

    if (!mocks.length) {
        mockAdapter.onPost(`${metricsOptions.host}/${metricsOptions.processMeasurement}`).reply(200);
        mockAdapter.onPost(`${metricsOptions.host}/${metricsOptions.curlMeasurement}`).reply(200);
    }

    return mockAdapter;
}
