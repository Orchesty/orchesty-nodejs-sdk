import {
    FORCE_TARGET_QUEUE,
    getLimiterKey,
    getLimiterKeyWithGroup,
    IHttpHeaders,
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

export default abstract class AProcessDto<JsonData = unknown> {

    // Do not dare to touch this !! This serves for simple ObjectPool implementation
    protected free: boolean;

    protected headers: IHttpHeaders;

    protected data: string;

    public constructor() {
        this.data = '';
        this.headers = {};
        this.free = true;
    }

    public getUser(): string | undefined {
        const value = this.headers.user;

        return value ? String(value) : undefined;
    }

    public setUser(value: string | undefined): this {
        this.headers.user = value;

        return this;
    }

    public getData(): string {
        return this.data;
    }

    public getJsonData(): JsonData {
        return JSON.parse(this.data || '{}');
    }

    public isFree(): boolean {
        return this.free;
    }

    public setFree(free: boolean): this {
        if (free) {
            this.clearData();
            this.headers = {};
        }
        this.free = free;

        return this;
    }

    public getHeaders(): IHttpHeaders {
        return this.headers;
    }

    public setHeaders(headers: IHttpHeaders): this {
        this.headers = headers;

        return this;
    }

    public addHeader(key: string, value: string): this {
        this.headers[key] = value;

        return this;
    }

    public removeHeader(key: string): this {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.headers[key];

        return this;
    }

    public removeHeaders(): this {
        this.headers = {};

        return this;
    }

    public getHeader(key: string, defaultValue?: string): string | undefined {
        const value = this.headers[key];

        return value ? String(value) : defaultValue;
    }

    public setSuccessProcess(message = 'Message has been processed successfully.'): this {
        this.setStatusHeader(ResultCode.SUCCESS, message);

        return this;
    }

    public setStopProcess(status: ResultCode, reason: string): this {
        AProcessDto.validateStatus(status);

        this.setStatusHeader(status, reason);

        return this;
    }

    public setLimitExceeded(reason: string): this {
        this.setStatusHeader(ResultCode.LIMIT_EXCEEDED, reason);

        return this;
    }

    public setRepeater(interval: number, maxHops: number, reason: string): this {
        if (interval < 1) {
            throw new Error('Value interval is obligatory and can not be lower than 0');
        }
        if (maxHops < 1) {
            throw new Error('Value maxHops is obligatory and can not be lower than 0');
        }

        this.setStatusHeader(ResultCode.REPEAT, reason);

        this.addHeader(REPEAT_INTERVAL, interval.toString());
        this.addHeader(REPEAT_MAX_HOPS, maxHops.toString());

        return this;
    }

    public removeRepeater(): this {
        this.removeHeader(REPEAT_INTERVAL);
        this.removeHeader(REPEAT_MAX_HOPS);
        this.removeHeader(REPEAT_HOPS);
        this.removeHeader(REPEAT_QUEUE);
        this.removeRelatedHeaders([ResultCode.REPEAT]);

        return this;
    }

    public setLimiter(key: string, time: number, amount: number): this {
        this.addHeader(LIMITER_KEY, getLimiterKey(key, time, amount));

        return this;
    }

    public setLimiterWithGroup(
        key: string,
        time: number,
        amount: number,
        groupKey: string,
        groupTime: number,
        groupAmount: number,
    ): this {
        this.addHeader(LIMITER_KEY, getLimiterKeyWithGroup(key, time, amount, groupKey, groupTime, groupAmount));

        return this;
    }

    public removeLimiter(): this {
        this.removeHeader(LIMITER_KEY);

        return this;
    }

    public setForceFollowers(...followers: string[]): this {
        const workerFollowers: { name: string; id: string }[] = JSON.parse(this.getHeader(WORKER_FOLLOWERS, '[]') as string);
        const filtered = workerFollowers.filter((item) => followers.includes(item.name));
        const targetQueues = filtered.map((item) => item.id).join(',');

        if (!targetQueues) {
            const workerFollowerNames = workerFollowers.map((follower) => follower.name).join(',');
            throw new Error(`Inserted follower(s) [${followers.join(',')}] can't be reached. Available follower(s) [${workerFollowerNames}]`);
        }

        this.addHeader(FORCE_TARGET_QUEUE, targetQueues);
        this.setStatusHeader(
            ResultCode.FORWARD_TO_TARGET_QUEUE,
            `Message will be force re-routed to [${targetQueues}] follower(s).`,
        );

        return this;
    }

    public removeForceFollowers(): this {
        this.removeHeader(FORCE_TARGET_QUEUE);
        this.removeRelatedHeaders([ResultCode.FORWARD_TO_TARGET_QUEUE]);

        return this;
    }

    public getBridgeData(): unknown {
        return this.data;
    }

    protected static validateStatus(code: number): void {
        if (!ALLOWED_RESULT_CODES.includes(code)) {
            throw new Error('Value does not match with the required one');
        }
    }

    protected clearData(): this {
        this.data = '';

        return this;
    }

    protected setStatusHeader(value: ResultCode, message?: string): this {
        if (message) {
            this.addHeader(RESULT_MESSAGE, message.replace(/\r?\n|\r/g, ''));
        }
        this.addHeader(RESULT_CODE, value.toString());

        return this;
    }

    protected removeRelatedHeaders(headerCodes: number[]): this {
        if (headerCodes.includes(Number(this.getHeader(RESULT_CODE, '0')))) {
            this.removeHeader(RESULT_MESSAGE);
            this.removeHeader(RESULT_CODE);
        }

        return this;
    }

}
