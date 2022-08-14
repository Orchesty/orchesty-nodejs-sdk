import { BodyInit, HeaderInit, Headers } from 'node-fetch';
import { IRequestDto } from '../IRequestDto';
import HttpMethods from '../HttpMethods';
import AProcessDto from '../../Utils/AProcessDto';

export default class RequestDto implements IRequestDto {
  private _timeout: number;

  public constructor(
    private _url: string,
    private _method: HttpMethods,
    private _debugInfo: AProcessDto,
    private _body?: BodyInit,
    private _headers: HeaderInit = new Headers(),
  ) {
    this._timeout = 30000; // 30sec as a default timeout
  }

  public get body(): BodyInit | undefined {
    return this._body;
  }

  public set body(body: BodyInit | undefined) {
    this._body = body;
  }

  public setJsonBody(body: unknown): void {
    this._body = JSON.stringify(body);
  }

  public get headers(): HeaderInit {
    return this._headers;
  }

  public set headers(headers: HeaderInit) {
    this._headers = headers;
  }

  public addHeaders(headers: HeaderInit): this {
    this._headers = { ...this._headers, ...headers };

    return this;
  }

  public get method(): HttpMethods {
    return this._method;
  }

  public set method(method: HttpMethods) {
    this._method = method;
  }

  public get url(): string {
    return this._url;
  }

  public set url(url: string) {
    this._url = url;
  }

  public set timeout(ms: number) {
    this._timeout = ms;
  }

  public get timeout(): number {
    return this._timeout;
  }

  public get debugInfo(): AProcessDto {
    return this._debugInfo;
  }

  public set debugInfo(dto: AProcessDto) {
    this._debugInfo = dto;
  }
}
