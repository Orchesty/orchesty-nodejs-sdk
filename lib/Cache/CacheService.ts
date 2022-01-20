import fetch, { HeadersInit, Response } from 'node-fetch';
import logger from 'winston';
import HttpMethods from '../Transport/HttpMethods';
import Redis from '../Storage/Redis/Redis';

export interface ICacheCallback<T> {
  dataToStore: T;
  expire: number;
}

export interface IRequest {
  url: string,
  method: HttpMethods,
  body?: unknown,
  headers?: HeadersInit | undefined,
}

const MAX_TRY = 15;

export default class CacheService {
  constructor(private _redis: Redis) {
  }

  public async entry<T>(
    cacheKey: string,
    request: IRequest,
    getDataCallback: (res: Response) => Promise<ICacheCallback<T>>,
    allowedCodes = [200],
  ): Promise<T> {
    try {
      // Restore if exist
      const data = await this._redis.get(cacheKey);
      if (data) {
        return JSON.parse(data);
      }

      // Call endpoint for data
      const response = await this.send(request);
      if (!allowedCodes.includes(response.status)) {
        logger.error(response);
        throw new Error(`Response return [${response.status}] with body: [${await response.text()}]`);
      }

      // Parse response & store data to cache & remove lock
      const dataCallback = await getDataCallback(response);
      if (dataCallback.expire > 1) {
        if (!await this._redis.set(cacheKey, JSON.stringify(dataCallback.dataToStore), dataCallback.expire)) {
          throw new Error('Value could not be saved to the Redis');
        }
      }

      return dataCallback.dataToStore;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error in CacheService.';
      logger.error(msg);

      throw new Error(`Unexpected error: ${msg}`);
    }
  }

  public async entryWithLock<T>(
    cacheKey: string,
    lockKey: string,
    request: IRequest,
    getDataCallback: (res: Response) => Promise<ICacheCallback<T>>,
    allowedCodes = [200],
    tryCount = 0,
  ): Promise<T> {
    if (tryCount > MAX_TRY) {
      await this._redis.remove(lockKey);
      throw new Error('Max tries has been reached');
    }

    try {
      // Restore if exist
      const data = await this._redis.get(cacheKey);
      if (data) {
        return JSON.parse(data);
      }

      // Lock
      if (await this._redis.isLocked(lockKey)) {
        return this._recurseEntryWithLock<T>(
          cacheKey,
          lockKey,
          request,
          getDataCallback,
          allowedCodes,
          tryCount + 1,
        );
      }

      // Call endpoint for data
      const response = await this.send(request);
      if (response.status === 429) {
        return this._recurseEntryWithLock<T>(
          cacheKey,
          lockKey,
          request,
          getDataCallback,
          allowedCodes,
          tryCount + 1,
        );
      }
      if (!allowedCodes.includes(response.status)) {
        await this._redis.remove(lockKey);
        logger.error(response);
        throw new Error(`Response return [${response.status}] with body: [${await response.text()}]`);
      }

      // Parse response & store data to cache & remove lock
      const dataCallback = await getDataCallback(response);
      if (dataCallback.expire > 1) {
        if (!await this._redis.set(cacheKey, JSON.stringify(dataCallback.dataToStore), dataCallback.expire)) {
          await this._redis.remove(lockKey);
          throw new Error('Value could not be saved to the Redis');
        }
      }
      await this._redis.remove(lockKey);

      return dataCallback.dataToStore;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error in CacheService.';
      logger.error(msg);

      throw new Error(`Unexpected error: ${msg}`);
    }
  }

  public send = async (request: IRequest): Promise<Response> => {
    let reqBody;

    let head: HeadersInit = {
      ...request.headers,
      accept: 'application/json',
    };

    if (request.method !== HttpMethods.GET && request.body) {
      head = {
        ...head,
        'Content-Type': 'application/json-patch+json',
      };
      reqBody = JSON.stringify(request.body);
    }

    try {
      return fetch(
        request.url,
        {
          method: request.method,
          headers: head,
          body: reqBody,
        },
      );
    } catch (e) {
      logger.error(e);
      throw e;
    }
  };

  private async _recurseEntryWithLock<T>(
    cacheKey: string,
    lockKey: string,
    request: IRequest,
    getDataCallback: (res: Response) => Promise<ICacheCallback<T>>,
    allowedCodes: number[],
    tryCount: number,
  ): Promise<T> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      setTimeout(async () => resolve(this.entryWithLock<T>(
        cacheKey,
        lockKey,
        request,
        getDataCallback,
        allowedCodes,
        tryCount + 1,
      )), 2000);
    });
  }
}
