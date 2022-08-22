import AProcessDto from './AProcessDto';
import { BATCH_CURSOR, IHttpHeaders } from './Headers';
import ResultCode from './ResultCode';

export interface IBatchMessage {
    body: string; // Is string to support XML fe.
    headers: Record<string, string[] | string> | null;
}

export default class BatchProcessDto extends AProcessDto {

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

    public addItem(body: unknown, user?: string): this {
        let b = body;
        if (typeof body !== 'string') {
            b = JSON.stringify(body);
        }

        this.messages.push({
            headers: user ? { user } : null,
            body: b as string,
        });

        return this;
    }

    public setItemList(list: string[] | unknown[]): this {
        list.forEach((it) => {
            this.addItem(it);
        });

        return this;
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
