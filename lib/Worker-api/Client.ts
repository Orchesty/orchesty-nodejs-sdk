import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { orchestyOptions } from '../Config/Config';
import { HttpMethods } from '../Transport/HttpMethods';
import { CommonHeaders, ORCHESTY_API_KEY } from '../Utils/Headers';

export default class Client {

    public constructor(private readonly workerApiHost: string) {
    }

    public async send(
        path: string,
        method: HttpMethods,
        data?: unknown,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse> {
        const req: AxiosRequestConfig = {
            method,
            data: data ? JSON.stringify(data) : undefined,
            headers: {
                ...{
                    [ORCHESTY_API_KEY]: orchestyOptions.orchestyApiKey,
                    [CommonHeaders.CONTENT_TYPE]: 'application/json',
                },
                ...headers,
            },
            timeout: 10000,
            responseType: 'json',
            validateStatus: () => true,
        };

        return axios(`${this.workerApiHost}${path}`, req);
    }

}
