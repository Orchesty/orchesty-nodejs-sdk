import AProcessDto from './AProcessDto';
import { BATCH_CURSOR, IHttpHeaders, LIMITER_KEY, parseLimitKey } from './Headers';
import ResultCode from './ResultCode';

export interface IBatchMessage {
    body: string; // Is string to support XML fe.
    headers: Record<string, string[] | string> | null;
}

export default class BatchProcessDto<Data = unknown, Item = unknown> extends AProcessDto<Data> {

    private messages: IBatchMessage[];

    public constructor(commonHeaders: IHttpHeaders = {}) {
        super();
        this.messages = [];
        this.headers = commonHeaders;
    }

    public getMessages(): IBatchMessage[] {
        return this.messages;
    }

    public setMessages(messages: IBatchMessage[]): this {
        this.messages = messages;

        return this;
    }

    public addItem(body: Item, user?: string, limit?: string): BatchProcessDto<Item> {
        let b: unknown = body;
        if (typeof body !== 'string') {
            b = JSON.stringify(body);
        }

        const limits = parseLimitKey(this.headers?.[LIMITER_KEY] as string);
        if (limit) {
            limits[limit.split(';')[0]] = limit;
        }

        this.messages.push({
            headers: {
                ...limit ? { [LIMITER_KEY]: Object.values(limits).join(';') } : null,
                ...user ? { user } : null,
            },
            body: b as string,
        });

        return this as unknown as BatchProcessDto<Item>;
    }

    public setItemList(list: Item[]): BatchProcessDto<Item[]> {
        list.forEach((it) => {
            this.addItem(it);
        });

        return this as unknown as BatchProcessDto<Item[]>;
    }

    public addMessage(message: IBatchMessage): this {
        this.messages.push(message);

        return this;
    }

    public setBatchCursor(cursor: string, iterateOnly = false): void {
        this.addHeader(BATCH_CURSOR, cursor);
        if (iterateOnly) {
            this.setStatusHeader(
                ResultCode.BATCH_CURSOR_ONLY,
                `Message will be used as a iterator with cursor [${cursor}]. No follower will be called.`,
            );
        } else {
            this.setStatusHeader(
                ResultCode.BATCH_CURSOR_WITH_FOLLOWERS,
                `Message will be used as a iterator with cursor [${cursor}]. Data will be send to follower(s).`,
            );
        }
    }

    public getBatchCursor(defaultValue = ''): string {
        return this.getHeader(BATCH_CURSOR, defaultValue) as string;
    }

    public removeBatchCursor(): void {
        this.removeHeader(BATCH_CURSOR);
        this.removeRelatedHeaders([ResultCode.BATCH_CURSOR_ONLY, ResultCode.BATCH_CURSOR_WITH_FOLLOWERS]);
    }

    public setBridgeData(data: string): void {
        this.data = data;
    }

    public getBridgeData(): unknown {
        return JSON.stringify(this.messages);
    }

    protected clearData(): void {
        this.messages = [];
    }

}
