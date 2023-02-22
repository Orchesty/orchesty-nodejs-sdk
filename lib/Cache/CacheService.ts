import logger from '../Logger/Logger';
import Redis from '../Storage/Redis/Redis';
import CurlSender from '../Transport/Curl/CurlSender';
import RequestDto from '../Transport/Curl/RequestDto';
import ResponseDto from '../Transport/Curl/ResponseDto';
import { IResultRanges, repeatOnErrorRanges } from '../Transport/Curl/ResultCodeRange';

export interface ICacheCallback<T> {
    dataToStore: T;
    expire: number;
}

const MAX_TRY = 60;

export default class CacheService {

    public constructor(private readonly redis: Redis, private readonly curlSender: CurlSender) {
    }

    public async entry<T>(
        cacheKey: string,
        requestDto: RequestDto,
        getDataCallback: (res: ResponseDto) => Promise<ICacheCallback<T>>,
        allowedCodes = repeatOnErrorRanges,
    ): Promise<T> {
        try {
            // Restore if exist
            const data = await this.redis.get(cacheKey);
            if (data) {
                return JSON.parse(data);
            }

            // Call endpoint for data
            const response = await this.curlSender.send(requestDto, allowedCodes);

            // Parse response & store data to cache & remove lock
            const dataCallback = await getDataCallback(response);
            if (dataCallback.expire > 1) {
                if (!await this.redis.set(cacheKey, JSON.stringify(dataCallback.dataToStore), dataCallback.expire)) {
                    throw new Error('Value could not be saved to the Redis');
                }
            }

            return dataCallback.dataToStore;
        } catch (e) {
            const msg = 'Unknown error in CacheService.';
            if (e instanceof Error) {
                logger.error(e.message, {}, false, e);
            } else {
                logger.error(msg, {});
            }

            throw new Error(`Unexpected error: ${msg}`);
        }
    }

    public async entryWithLock<T>(
        cacheKey: string,
        lockKey: string,
        requestDto: RequestDto,
        getDataCallback: (res: ResponseDto) => Promise<ICacheCallback<T>>,
        allowedCodes = repeatOnErrorRanges,
        tryCount = 0,
    ): Promise<T> {
        if (tryCount > MAX_TRY) {
            await this.redis.remove(lockKey);
            throw new Error('Max tries has been reached');
        }

        try {
            // Restore if exist
            const data = await this.redis.get(cacheKey);
            if (data) {
                return JSON.parse(data);
            }

            // Lock
            if (await this.redis.isLocked(lockKey)) {
                // eslint-disable-next-line @typescript-eslint/return-await
                return this.recurseEntryWithLock<T>(
                    cacheKey,
                    lockKey,
                    requestDto,
                    getDataCallback,
                    allowedCodes,
                    tryCount,
                );
            }

            // Call endpoint for data
            const response = await this.curlSender.send(requestDto, allowedCodes);

            // Parse response & store data to cache & remove lock
            const dataCallback = await getDataCallback(response);
            if (dataCallback.expire > 1) {
                if (!await this.redis.set(cacheKey, JSON.stringify(dataCallback.dataToStore), dataCallback.expire)) {
                    await this.redis.remove(lockKey);
                    throw new Error('Value could not be saved to the Redis');
                }
            }
            await this.redis.remove(lockKey);

            return dataCallback.dataToStore;
        } catch (e) {
            const msg = 'Unknown error in CacheService.';
            if (e instanceof Error) {
                logger.error(e.message, {}, false, e);
            } else {
                logger.error(msg, {});
            }

            throw new Error(`Unexpected error: ${msg}`);
        }
    }

    private async recurseEntryWithLock<T>(
        cacheKey: string,
        lockKey: string,
        requestDto: RequestDto,
        getDataCallback: (res: ResponseDto) => Promise<ICacheCallback<T>>,
        allowedCodes: IResultRanges,
        tryCount: number,
    ): Promise<T> {
        return new Promise((resolve) => {
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
