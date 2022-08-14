import { Headers } from 'node-fetch';
import { IResponseDto } from '../IResponseDto';

export default class ResponseDto<JsonBody = unknown> implements IResponseDto {
  public constructor(
    private readonly _body: string,
    private readonly _code: number,
    private readonly _headers: Headers,
    private readonly _reason?: string,
  ) {
  }

  public get headers(): Headers {
    return this._headers;
  }

  public get body(): string {
    return this._body;
  }

  public get jsonBody(): JsonBody {
    return JSON.parse(this._body);
  }

  public get reason(): string | undefined {
    return this._reason;
  }

  public get responseCode(): number {
    return this._code;
  }
}
