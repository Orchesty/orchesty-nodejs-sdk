import { BATCH_CURSOR, HttpHeaders } from './Headers';
import AProcessDto from './AProcessDto';
import ResultCode from './ResultCode';

export interface IBatchMessage {
  body: string; // Is string to support XML fe.
  headers: Record<string, string | string[]> | null;
}

export default class BatchProcessDto extends AProcessDto {
  private _messages: IBatchMessage[];

  public constructor(commonHeaders: HttpHeaders = {}) {
    super();
    this._messages = [];
    this._headers = commonHeaders;
  }

  public addItem(body: unknown, user?: string): BatchProcessDto {
    let b = body;
    if (typeof body !== 'string') {
      b = JSON.stringify(body);
    }

    this._messages.push({
      headers: user ? { user } : null,
      body: b as string,
    });

    return this;
  }

  public setItemList(list: unknown[] | string[]): BatchProcessDto {
    list.forEach((it) => {
      this.addItem(it);
    });

    return this;
  }

  public addMessage(message: IBatchMessage): BatchProcessDto {
    this._messages.push(message);

    return this;
  }

  public get messages(): IBatchMessage[] {
    return this._messages;
  }

  public set messages(messages: IBatchMessage[]) {
    this._messages = messages;
  }

  public setBatchCursor(cursor: string, iterateOnly = false): void {
    this.addHeader(BATCH_CURSOR, cursor);
    if (iterateOnly) {
      this._setStatusHeader(
        ResultCode.BATCH_CURSOR_ONLY,
        `Message will be used as a iterator with cursor [${cursor}]. No follower will be called.`,
      );
    } else {
      this._setStatusHeader(
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
    this._removeRelatedHeaders([ResultCode.BATCH_CURSOR_ONLY, ResultCode.BATCH_CURSOR_WITH_FOLLOWERS]);
  }

  public setBridgeData(data: string): void {
    this._data = data;
  }

  public getBridgeData(): unknown {
    return JSON.stringify(this._messages);
  }

  protected _clearData(): void {
    this.messages = [];
  }
}
