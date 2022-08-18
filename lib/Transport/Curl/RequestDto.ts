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

    public setBody(body: BodyInit | undefined): this {
        this.body = body;

        return this;
    }

    public getHeaders(): HeaderInit {
        return this.headers;
    }

    public setHeaders(headers: HeaderInit): this {
        this.headers = headers;

        return this;
    }

    public getMethod(): HttpMethods {
        return this.method;
    }

    public setMethod(method: HttpMethods): this {
        this.method = method;

        return this;
    }

    public getUrl(): string {
        return this.url;
    }

    public setUrl(url: string): this {
        this.url = url;

        return this;
    }

    public setTimeout(ms: number): this {
        this.timeout = ms;

        return this;
    }

    public getTimeout(): number {
        return this.timeout;
    }

    public getDebugInfo(): AProcessDto {
        return this.debugInfo;
    }

    public setDebugInfo(dto: AProcessDto): this {
        this.debugInfo = dto;

        return this;
    }

    public addHeaders(headers: HeaderInit): this {
        this.headers = { ...this.headers, ...headers };

        return this;
    }

    public setJsonBody(body: unknown): this {
        this.body = JSON.stringify(body);

        return this;
    }

}
