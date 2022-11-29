import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { metricsOptions, orchestyOptions } from '../../lib/Config/Config';

export interface IMockServer {
    resCode?: number;
    url: string;
    resBody: string;
}

export const mockAdapter = new MockAdapter(axios);

export function createLoggerMockedServer(mocks: IMockServer[] = []): MockAdapter {
    mocks.forEach((mock) => {
        mockAdapter.onPost(mock.url).replyOnce(mock.resCode ?? 200, mock.resBody);
    });

    if (!mocks.length) {
        mockAdapter.onPost(`${orchestyOptions.workerApi}/logger/logs`).reply(200);
    }

    return mockAdapter;
}

export function createMetricsMockedServer(mocks: IMockServer[] = []): MockAdapter {
    mocks.forEach((mock) => {
        mockAdapter.onPost(mock.url).replyOnce(mock.resCode ?? 200, mock.resBody);
    });

    if (!mocks.length) {
        mockAdapter.onPost(`${orchestyOptions.workerApi}/metrics/${metricsOptions.processMeasurement}`).reply(200);
        mockAdapter.onPost(`${orchestyOptions.workerApi}/metrics/${metricsOptions.curlMeasurement}`).reply(200);
    }

    return mockAdapter;
}
