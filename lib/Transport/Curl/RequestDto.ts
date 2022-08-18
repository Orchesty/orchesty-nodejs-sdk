import { BodyInit, HeaderInit, Headers } from 'node-fetch';
import AProcessDto from '../../Utils/AProcessDto';
import HttpMethods from '../HttpMethods';
import { IRequestDto } from '../IRequestDto';

export default class RequestDto implements IRequestDto {

    private timeout: number;

    public constructor(
        private url: string,
        private method: HttpMethods,
        private debugInfo: AProcessDto,
        private body?: BodyInit,
        private headers: HeaderInit = new Headers(),
    ) {
        this.timeout = 30000; // 30sec as a default timeout
    }

    public getBody(): BodyInit | undefined {
        return this.body;
    }

    public setBody(body: BodyInit | undefined) {
        this.body = body;
    }

    public getHeaders(): HeaderInit {
        return this.headers;
    }

    public setHeaders(headers: HeaderInit) {
        this.headers = headers;
    }

    public getMethod(): HttpMethods {
        return this.method;
    }

    public setMethod(method: HttpMethods) {
        this.method = method;
    }

    public getUrl(): string {
        return this.url;
    }

    public setUrl(url: string) {
        this.url = url;
    }

    public setTimeout(ms: number) {
        this.timeout = ms;
    }

    public getTimeout(): number {
        return this.timeout;
    }

    public getDebugInfo(): AProcessDto {
        return this.debugInfo;
    }

    public setDebugInfo(dto: AProcessDto) {
        this.debugInfo = dto;
    }

    public addHeaders(headers: HeaderInit): this {
        this.headers = { ...this.headers, ...headers };

        return this;
    }

    public setJsonBody(body: unknown): void {
        this.body = JSON.stringify(body);
    }

}
