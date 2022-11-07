import { IResponseDto } from '../IResponseDto';

export default class ResponseDto<JsonBody = unknown> implements IResponseDto<JsonBody> {

    public constructor(
        private readonly body: string,
        private readonly code: number,
        private readonly headers: Record<string, unknown>,
        private readonly buffer: Buffer,
        private readonly reason?: string,
    ) {
    }

    public getHeaders(): Record<string, unknown> {
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
