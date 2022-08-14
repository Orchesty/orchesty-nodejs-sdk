import logger from 'winston';
import Redis from '../Storage/Redis/Redis';
import CurlSender from '../Transport/Curl/CurlSender';
import RequestDto from '../Transport/Curl/RequestDto';
import ResponseDto from '../Transport/Curl/ResponseDto';

export interface ICacheCallback<T> {
  dataToStore: T;
  expire: number;
}

const MAX_TRY = 15;

export default class CacheService {
  public constructor(private readonly _redis: Redis, private readonly _curlSender: CurlSender) {
  }

  public async entry<T>(
    cacheKey: string,
    requestDto: RequestDto,
    getDataCallback: (res: ResponseDto) => Promise<ICacheCallback<T>>,
    allowedCodes = [200],
  ): Promise<T> {
    try {
      // Restore if exist
      const data = await this._redis.get(cacheKey);
      if (data) {
        return JSON.parse(data);
      }

      // Call endpoint for data
      const response = await this._curlSender.send(requestDto, allowedCodes);

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
    requestDto: RequestDto,
    getDataCallback: (res: ResponseDto) => Promise<ICacheCallback<T>>,
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
        // eslint-disable-next-line @typescript-eslint/return-await
        return this._recurseEntryWithLock<T>(
          cacheKey,
          lockKey,
          requestDto,
          getDataCallback,
          allowedCodes,
          tryCount + 1,
        );
      }

      // Call endpoint for data
      const response = await this._curlSender.send(requestDto, allowedCodes);

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

  private async _recurseEntryWithLock<T>(
    cacheKey: string,
    lockKey: string,
    requestDto: RequestDto,
    getDataCallback: (res: ResponseDto) => Promise<ICacheCallback<T>>,
    allowedCodes: number[],
    tryCount: number,
  ): Promise<T> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      setTimeout(() => resolve(this.entryWithLock<T>(
        cacheKey,
        lockKey,
        requestDto,
        getDataCallback,
        allowedCodes,
        tryCount + 1,
      )), 2000);
    });
  }
}
