import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { orchestyOptions } from '../Config/Config';
import { HttpMethods } from '../Transport/HttpMethods';

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
            headers: { ...{ 'orchesty-api-key': orchestyOptions.orchestyApiKey }, ...headers },
            timeout: 10000,
            responseType: 'arraybuffer',
            validateStatus: () => true,
        };

        return axios(`${this.workerApiHost}${path}`, req);
    }

}
