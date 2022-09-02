import { Headers } from 'node-fetch';
import { IResponseDto } from '../IResponseDto';

export default class ResponseDto<JsonBody = unknown> implements IResponseDto {

    public constructor(
        private readonly body: string,
        private readonly code: number,
        private readonly headers: Headers,
        private readonly buffer: Buffer,
        private readonly reason?: string,
    ) {
    }

    public getHeaders(): Headers {
        return this.headers;
    }

    public getBody(): string {
        return this.body;
    }

    public getJsonBody(): JsonBody {
        return JSON.parse(this.body);
    }

    public getBuffer(): Buffer {
        return this.buffer;
    }

    public getReason(): string | undefined {
        return this.reason;
    }

    public getResponseCode(): number {
        return this.code;
    }

}
