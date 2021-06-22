import { IResponseDto } from '../IResponseDto';

export default class ResponseDto implements IResponseDto {
  constructor(private _body: string, private _code: number, private _reason?: string) {
  }

  getBody(): string {
    return this._body;
  }

  getJsonBody(): unknown {
    return JSON.parse(this._body);
  }

  getReason(): string|undefined {
    return this._reason;
  }

  getResponseCode(): number {
    return this._code;
  }

  setBody(body: string): void {
    this._body = body;
  }
}
