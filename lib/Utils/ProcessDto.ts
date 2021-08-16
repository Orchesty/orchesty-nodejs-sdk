import * as util from 'util';
import {
  BATCH_CURSOR,
  clear,
  createKey,
  FORCE_TARGET_QUEUE,
  HttpHeaders,
  LIMITER_KEY,
  REPEAT_HOPS,
  REPEAT_INTERVAL,
  REPEAT_MAX_HOPS,
  REPEAT_QUEUE,
  RESULT_CODE,
  RESULT_MESSAGE,
  WORKER_FOLLOWERS,
} from './Headers';
import ResultCode from './ResultCode';

const ALLOWED_RESULT_CODES = [ResultCode.STOP_AND_FAILED, ResultCode.DO_NOT_CONTINUE];

export default class ProcessDto {
  // Do not dare to touch this !! This serves for simple ObjectPool implementation
  public free: boolean;

  private _data: string;

  private _headers: HttpHeaders;

  constructor() {
    this._data = '';
    this._headers = {};
    this.free = true;
  }

  get data(): string {
    return this._data;
  }

  set data(data: string) {
    this._data = data;
  }

  get jsonData(): unknown {
    return JSON.parse(this._data);
  }

  set jsonData(body: unknown) {
    this._data = JSON.stringify(body);
  }

  get headers(): HttpHeaders {
    return this._headers;
  }

  set headers(headers: HttpHeaders) {
    this._headers = clear(headers);
  }

  addHeader(key: string, value: string): void {
    this._headers[createKey(key)] = value;
  }

  removeHeader(key: string): void {
    delete (this._headers[createKey(key)]);
  }

  removeHeaders(): void {
    this._headers = {};
  }

  getHeader(key: string, defaultValue?: string): string | undefined {
    const value = this._headers[createKey(key)];

    return value ? String(value) : defaultValue;
  }

  setSuccessProcess(message?: string): void {
    this._setStatusHeader(ResultCode.SUCCESS, message);
  }

  setStopProcess(status: ResultCode, message?: string): void {
    ProcessDto._validateStatus(status);

    this._setStatusHeader(status, message);
  }

  setRepeater(interval: number, maxHops: number, queue?: string, message?: string): void {
    if (interval < 1) {
      throw new Error('Value interval is obligatory and can not be lower than 0');
    }
    if (maxHops < 1) {
      throw new Error('Value maxHops is obligatory and can not be lower than 0');
    }

    this._setStatusHeader(ResultCode.REPEAT, message ?? 'Repeater applied.');

    this.addHeader(REPEAT_INTERVAL, interval.toString());
    this.addHeader(REPEAT_MAX_HOPS, maxHops.toString());

    if (queue) {
      this.addHeader(REPEAT_QUEUE, queue);
    }
  }

  removeRepeater(): void {
    this.removeHeader(REPEAT_INTERVAL);
    this.removeHeader(REPEAT_MAX_HOPS);
    this.removeHeader(REPEAT_HOPS);
    this.removeHeader(REPEAT_QUEUE);
  }

  setLimiter(key: string, time: number, amount: number): void {
    const lk = util.format('%s;%s;%s', ProcessDto._decorateLimitKey(key), time, amount);
    this.addHeader(LIMITER_KEY, lk);
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
      ProcessDto._decorateLimitKey(key),
      time,
      amount,
      ProcessDto._decorateLimitKey(groupKey),
      groupTime,
      groupAmount,
    );
    this.addHeader(LIMITER_KEY, lk);
  }

  removeLimiter(): void {
    this.removeHeader(LIMITER_KEY);
  }

  setBatchCursor(cursor: string, iterateOnly = false): void {
    this.addHeader(BATCH_CURSOR, cursor);
    if (iterateOnly) {
      this._setStatusHeader(ResultCode.BATCH_CURSOR_ONLY);
    } else {
      this._setStatusHeader(ResultCode.BATCH_CURSOR_WITH_FOLLOWERS);
    }
  }

  getBatchCursor(defaultValue = ''): string {
    return this.getHeader(BATCH_CURSOR, defaultValue) as string;
  }

  removeBatchCursor(): void {
    this.removeHeader(BATCH_CURSOR);
  }

  setForceFollowers(...followers: string[]): void {
    const workerFollowers: {name: string; id: string}[] = JSON.parse(this.getHeader(WORKER_FOLLOWERS, '[]') as string);
    const filtered = workerFollowers.filter((item) => followers.includes(item.name));

    this.addHeader(FORCE_TARGET_QUEUE, filtered.map((item) => item.id).join(','));
    this._setStatusHeader(ResultCode.FORWARD_TO_TARGET_QUEUE);
  }

  removeForceFollowers(): void {
    this.removeHeader(FORCE_TARGET_QUEUE);
  }

  private _setStatusHeader(value: ResultCode, message?: string) {
    if (message) {
      this.addHeader(RESULT_MESSAGE, message);
    }
    this.addHeader(RESULT_CODE, value.toString());
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
