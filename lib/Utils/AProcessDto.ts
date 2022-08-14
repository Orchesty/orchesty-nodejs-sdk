import * as util from 'util';
import {
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

export default abstract class AProcessDto {
  // Do not dare to touch this !! This serves for simple ObjectPool implementation
  protected _free: boolean;

  protected _headers: HttpHeaders;

  protected _data: string;

  public constructor() {
    this._data = '';
    this._headers = {};
    this._free = true;
  }

  public get user(): string | undefined {
    const value = this._headers.user;

    return value ? String(value) : undefined;
  }

  public set user(value: string | undefined) {
    this._headers.user = value;
  }

  public get data(): string {
    return this._data;
  }

  public get jsonData(): unknown {
    return JSON.parse(this._data || '{}');
  }

  public get free(): boolean {
    return this._free;
  }

  public set free(free: boolean) {
    if (free) {
      this._clearData();
      this._headers = {};
    }
    this._free = free;
  }

  public get headers(): HttpHeaders {
    return this._headers;
  }

  public set headers(headers: HttpHeaders) {
    this._headers = headers;
  }

  public addHeader(key: string, value: string): void {
    this._headers[key] = value;
  }

  public removeHeader(key: string): void {
    delete (this._headers[key]);
  }

  public removeHeaders(): void {
    this._headers = {};
  }

  public getHeader(key: string, defaultValue?: string): string | undefined {
    const value = this._headers[key];

    return value ? String(value) : defaultValue;
  }

  public setSuccessProcess(message = 'Message has been processed successfully.'): void {
    this._setStatusHeader(ResultCode.SUCCESS, message);
  }

  public setStopProcess(status: ResultCode, reason: string): void {
    AProcessDto._validateStatus(status);

    this._setStatusHeader(status, reason);
  }

  public setLimitExceeded(reason: string): void {
    this._setStatusHeader(ResultCode.LIMIT_EXCEEDED, reason);
  }

  public setRepeater(interval: number, maxHops: number, reason: string): void {
    if (interval < 1) {
      throw new Error('Value interval is obligatory and can not be lower than 0');
    }
    if (maxHops < 1) {
      throw new Error('Value maxHops is obligatory and can not be lower than 0');
    }

    this._setStatusHeader(ResultCode.REPEAT, reason);

    this.addHeader(REPEAT_INTERVAL, interval.toString());
    this.addHeader(REPEAT_MAX_HOPS, maxHops.toString());
  }

  public removeRepeater(): void {
    this.removeHeader(REPEAT_INTERVAL);
    this.removeHeader(REPEAT_MAX_HOPS);
    this.removeHeader(REPEAT_HOPS);
    this.removeHeader(REPEAT_QUEUE);
    this._removeRelatedHeaders([ResultCode.REPEAT]);
  }

  public setLimiter(key: string, time: number, amount: number): void {
    const lk = util.format('%s;%s;%s', AProcessDto._decorateLimitKey(key), time, amount);
    this.addHeader(LIMITER_KEY, lk);
  }

  public setLimiterWithGroup(
    key: string,
    time: number,
    amount: number,
    groupKey: string,
    groupTime: number,
    groupAmount: number,
  ): void {
    const lk = util.format(
      '%s;%s;%s;%s;%s;%s',
      AProcessDto._decorateLimitKey(key),
      time,
      amount,
      AProcessDto._decorateLimitKey(groupKey),
      groupTime,
      groupAmount,
    );
    this.addHeader(LIMITER_KEY, lk);
  }

  public removeLimiter(): void {
    this.removeHeader(LIMITER_KEY);
  }

  public setForceFollowers(...followers: string[]): void {
    const workerFollowers: {name: string; id: string}[] = JSON.parse(this.getHeader(WORKER_FOLLOWERS, '[]') as string);
    const filtered = workerFollowers.filter((item) => followers.includes(item.name));
    const targetQueues = filtered.map((item) => item.id).join(',');

    if (!targetQueues) {
      const workerFollowerNames = workerFollowers.map((follower) => follower.name).join(',');
      // eslint-disable-next-line max-len
      throw new Error(`Inserted follower(s) [${followers.join(',')}] can't be reached. Available follower(s) [${workerFollowerNames}]`);
    }

    this.addHeader(FORCE_TARGET_QUEUE, targetQueues);
    this._setStatusHeader(
      ResultCode.FORWARD_TO_TARGET_QUEUE,
      `Message will be force re-routed to [${targetQueues}] follower(s).`,
    );
  }

  public removeForceFollowers(): void {
    this.removeHeader(FORCE_TARGET_QUEUE);
    this._removeRelatedHeaders([ResultCode.FORWARD_TO_TARGET_QUEUE]);
  }

  public getBridgeData(): unknown {
    return this._data;
  }

  protected _clearData(): void {
    this._data = '';
  }

  protected _setStatusHeader(value: ResultCode, message?: string): void {
    if (message) {
      this.addHeader(RESULT_MESSAGE, message.replace(/\r?\n|\r/g, ''));
    }
    this.addHeader(RESULT_CODE, value.toString());
  }

  protected _removeRelatedHeaders(headerCodes: number[]): void {
    if (headerCodes.includes(Number(this.getHeader(RESULT_CODE, '0')) ?? 0)) {
      this.removeHeader(RESULT_MESSAGE);
      this.removeHeader(RESULT_CODE);
    }
  }

  protected static _decorateLimitKey(key: string): string {
    let newKey = key;
    if (!key.includes('|')) {
      newKey = util.format('%s|', key);
    }

    return newKey;
  }

  protected static _validateStatus(code: number): void {
    if (!ALLOWED_RESULT_CODES.includes(code)) {
      throw new Error('Value does not match with the required one');
    }
  }
}
