import AProcessDto from '../../Utils/AProcessDto';
import { HttpMethods } from '../HttpMethods';
import { IRequestDto } from '../IRequestDto';

export default class RequestDto implements IRequestDto {

    private timeout: number;

    public constructor(
        private url: string,
        private method: HttpMethods,
        private debugInfo: AProcessDto,
        private body?: unknown,
        private headers: Record<string, string> = {},
    ) {
        this.timeout = 30000; // 30sec as a default timeout
    }

    public getBody(): unknown {
        return this.body;
    }

    public setBody(body: unknown): this {
        this.body = body;

        return this;
    }

    public getHeaders(): Record<string, string> {
        return this.headers;
    }

    public setHeaders(headers: Record<string, string>): this {
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

    public addHeaders(headers: Record<string, string>): this {
        this.headers = { ...this.headers, ...headers };

        return this;
    }

    public setJsonBody(body: unknown): this {
        this.body = JSON.stringify(body);

        return this;
    }

}
