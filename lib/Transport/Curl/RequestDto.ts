import { BodyInit, HeaderInit, Headers } from 'node-fetch';
import AProcessDto from '../../Utils/AProcessDto';
import HttpMethods from '../HttpMethods';
import { IRequestDto } from '../IRequestDto';

export default class RequestDto implements IRequestDto {

    private clTimeout: number;

    public constructor(
        private clUrl: string,
        private clMethod: HttpMethods,
        private clDebugInfo: AProcessDto,
        private clBody?: BodyInit,
        private clHeaders: HeaderInit = new Headers(),
    ) {
        this.clTimeout = 30000; // 30sec as a default timeout
    }

    public get body(): BodyInit | undefined {
        return this.clBody;
    }

    public set body(body: BodyInit | undefined) {
        this.clBody = body;
    }

    public get headers(): HeaderInit {
        return this.clHeaders;
    }

    public set headers(headers: HeaderInit) {
        this.clHeaders = headers;
    }

    public get method(): HttpMethods {
        return this.clMethod;
    }

    public set method(method: HttpMethods) {
        this.clMethod = method;
    }

    public get url(): string {
        return this.clUrl;
    }

    public set url(url: string) {
        this.clUrl = url;
    }

    public set timeout(ms: number) {
        this.clTimeout = ms;
    }

    public get timeout(): number {
        return this.clTimeout;
    }

    public get debugInfo(): AProcessDto {
        return this.clDebugInfo;
    }

    public set debugInfo(dto: AProcessDto) {
        this.clDebugInfo = dto;
    }

    public addHeaders(headers: HeaderInit): this {
        this.clHeaders = { ...this.clHeaders, ...headers };

        return this;
    }

    public setJsonBody(body: unknown): void {
        this.clBody = JSON.stringify(body);
    }

}
