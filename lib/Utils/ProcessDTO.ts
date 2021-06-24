import * as util from 'util';
import {
  BATCH_CURSOR,
  clear,
  createKey,
  getRepeatHops,
  HttpHeaders,
  LIMITER_KEY,
  REPEAT_HOPS,
  REPEAT_INTERVAL,
  REPEAT_MAX_HOPS,
  REPEAT_QUEUE,
  RESULT_CODE,
  RESULT_MESSAGE,
} from './Headers';
import ResultCode from './ResultCode';

interface IProcessDTO {
  getData(): string;

  getJsonData(): unknown;

  setData(data: string): void;

  setJsonData(data: unknown): void;

  getHeaders(): HttpHeaders;

  getHeader(key: string, defaultValue?: string): string | undefined;

  setHeaders(headers: HttpHeaders): void;

  addHeader(key: string, value: string): void;

  removeHeader(key: string): void;

  removeHeaders(): void;

  setSuccessProcess(message?: string): void;

  setStopProcess(status: ResultCode, message?: string): void;

  setRepeater(interval: number, maxHops: number, repeatHops?: number, queue?: string, message?: string): void;

  removeRepeater(): void;

  setLimiter(key: string, time: number, value: number, lastUpdate?: Date): void;

  removeLimiter(): void;

  setBatchCursor(cursor: string): void;
}

const ALLOWED_RESULT_CODES = [ResultCode.STOP_AND_FAILED, ResultCode.DO_NOT_CONTINUE];

export default class ProcessDTO implements IProcessDTO {
  private _data: string;

  private _headers: HttpHeaders;

  constructor() {
    this._data = '';
    this._headers = {};
  }

  getData(): string {
    return this._data;
  }

  getJsonData(): unknown {
    return JSON.parse(this._data);
  }

  setData(data: string): void {
    this._data = data;
  }

  setJsonData(body: unknown): void {
    this._data = JSON.stringify(body);
  }

  getHeaders(): HttpHeaders {
    return this._headers;
  }

  addHeader(key: string, value: string): void {
    this._headers[key] = value;
  }

  removeHeader(key: string): void {
    delete (this._headers[key]);
  }

  removeHeaders(): void {
    this._headers = {};
  }

  getHeader(key: string, defaultValue?: string): string | undefined {
    if (!this._headers[key] && defaultValue) {
      return defaultValue;
    }

    if (this._headers[key]) {
      return String(this._headers[key]);
    }

    return undefined;
  }

  setHeaders(headers: HttpHeaders): void {
    this._headers = clear(headers);
  }

  setSuccessProcess(message?: string): void {
    this._setStatusHeader(ResultCode.SUCCESS, message);
  }

  setStopProcess(status: ResultCode, message?: string): void {
    ProcessDTO._validateStatus(status);

    this._setStatusHeader(status, message);
  }

  setRepeater(interval: number, maxHops: number, repeatHops?: number, queue?: string, message?: string): void {
    if (interval < 1) {
      throw new Error('Value interval is obligatory and can not be lower than 0');
    }
    if (maxHops < 1) {
      throw new Error('Value maxHops is obligatory and can not be lower than 0');
    }

    this._setStatusHeader(ResultCode.REPEAT, message ?? 'Repeater applied.');

    this.addHeader(createKey(REPEAT_INTERVAL), interval.toString());
    this.addHeader(createKey(REPEAT_MAX_HOPS), maxHops.toString());

    if (repeatHops) {
      this.addHeader(createKey(REPEAT_HOPS), repeatHops.toString());
    }

    if (queue) {
      this.addHeader(createKey(REPEAT_QUEUE), queue);
    }
  }

  incrementRepeaterHop(): void {
    const hop = getRepeatHops(this._headers) + 1;
    this.addHeader(createKey(REPEAT_HOPS), hop.toString());
  }

  removeRepeater(): void {
    this.removeHeader(createKey(REPEAT_INTERVAL));
    this.removeHeader(createKey(REPEAT_MAX_HOPS));
    this.removeHeader(createKey(REPEAT_HOPS));
    this.removeHeader(createKey(REPEAT_QUEUE));
  }

  setLimiter(key: string, time: number, amount: number): void {
    const lk = util.format('%s;%s;%s', ProcessDTO._decorateLimitKey(key), time, amount);
    this.addHeader(createKey(LIMITER_KEY), lk);
  }

  setLimiterWithGroup(
    key: string,
    time: number,
    amount: number,
    groupKey: string,
    groupTime: number,
    groupAmount: number,
  ): void {
    const lk = util.format(
      '%s;%s;%s;%s;%s;%s',
      ProcessDTO._decorateLimitKey(key),
      time,
      amount,
      ProcessDTO._decorateLimitKey(groupKey),
      groupTime,
      groupAmount,
    );
    this.addHeader(createKey(LIMITER_KEY), lk);
  }

  removeLimiter(): void {
    this.removeHeader(createKey(LIMITER_KEY));
  }

  setBatchCursor(cursor: string): void {
    this.addHeader(createKey(BATCH_CURSOR), cursor);
    this.addHeader(createKey(RESULT_CODE), ResultCode.BATCH_ITERATE.toString());
  }

  removeBatchCursor(): void {
    this.removeHeader(createKey(BATCH_CURSOR));
  }

  private _setStatusHeader(value: ResultCode, message?: string) {
    if (message) {
      this.addHeader(createKey(RESULT_MESSAGE), message);
    }
    this.addHeader(createKey(RESULT_CODE), value.toString());
  }

  private static _decorateLimitKey(key: string): string {
    let newKey = key;
    if (!key.includes('|')) {
      newKey = util.format('%s|', key);
    }

    return newKey;
  }

  private static _validateStatus(code: number): void {
    if (!ALLOWED_RESULT_CODES.includes(code)) {
      throw new Error('Value does not match with the required one');
    }
  }
}
