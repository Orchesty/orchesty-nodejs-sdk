import { BodyInit, HeaderInit, Headers } from 'node-fetch';
import { IRequestDto } from '../IRequestDto';
import HttpMethods from '../HttpMethods';
import AProcessDto from '../../Utils/AProcessDto';

export default class RequestDto implements IRequestDto {
  private _timeout: number;

  constructor(
    private _url: string,
    private _method: HttpMethods,
    private _debugInfo: AProcessDto,
    private _body?: BodyInit,
    private _headers: HeaderInit = new Headers(),
  ) {
    this._timeout = 30000; // 30sec as a default timeout
  }

  get body(): BodyInit | undefined {
    return this._body;
  }

  set body(body: BodyInit | undefined) {
    this._body = body;
  }

  get headers(): HeaderInit {
    return this._headers;
  }

  set headers(headers: HeaderInit) {
    this._headers = headers;
  }

  get method(): HttpMethods {
    return this._method;
  }

  set method(method: HttpMethods) {
    this._method = method;
  }

  get url(): string {
    return this._url;
  }

  set url(url: string) {
    this._url = url;
  }

  set timeout(ms: number) {
    this._timeout = ms;
  }

  get timeout(): number {
    return this._timeout;
  }

  get debugInfo(): AProcessDto {
    return this._debugInfo;
  }

  set debugInfo(dto: AProcessDto) {
    this._debugInfo = dto;
  }
}
