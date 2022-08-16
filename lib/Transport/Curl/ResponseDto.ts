import { Headers } from 'node-fetch';
import { IResponseDto } from '../IResponseDto';

export default class ResponseDto<JsonBody = unknown> implements IResponseDto {

    public constructor(
        private readonly clBody: string,
        private readonly clCode: number,
        private readonly clHeaders: Headers,
        private readonly clReason?: string,
    ) {
    }

    public get headers(): Headers {
        return this.clHeaders;
    }

    public get body(): string {
        return this.clBody;
    }

    public get jsonBody(): JsonBody {
        return JSON.parse(this.clBody);
    }

    public get reason(): string | undefined {
        return this.clReason;
    }

    public get responseCode(): number {
        return this.clCode;
    }

}
