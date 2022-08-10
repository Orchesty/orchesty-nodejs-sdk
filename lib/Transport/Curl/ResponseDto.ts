import { Headers } from 'node-fetch';
import { IResponseDto } from '../IResponseDto';

export default class ResponseDto<JsonBody = unknown> implements IResponseDto {
  constructor(
    private readonly _body: string,
    private readonly _code: number,
    private readonly _headers: Headers,
    private readonly _reason?: string,
  ) {
  }

  get headers(): Headers {
    return this._headers;
  }

  get body(): string {
    return this._body;
  }

  get jsonBody(): JsonBody {
    return JSON.parse(this._body);
  }

  get reason(): string | undefined {
    return this._reason;
  }

  get responseCode(): number {
    return this._code;
  }
}
