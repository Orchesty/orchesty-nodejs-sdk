import {
  BATCH_CURSOR, HttpHeaders,
} from './Headers';
import AProcessDto from './ProcessDto';
import ResultCode from './ResultCode';

export interface IBatchMessage {
  body:    string, // Is string to support XML fe.
  headers: Record<string, string | string[]> | null,
}

export default class BatchProcessDto extends AProcessDto {
  private _messages: IBatchMessage[];

  constructor(commonHeaders: HttpHeaders = {}) {
    super();
    this._messages = [];
    this._headers = commonHeaders;
  }

  addItem(body: unknown): BatchProcessDto {
    let b = body;
    if (typeof body != 'string') {
      b = JSON.stringify(body);
    }

    this._messages.push({
      headers: null,
      body: b as string,
    });

    return this;
  }

  setItemList(list: unknown[] | string[]): BatchProcessDto {
    list.forEach((it) => {
      this.addItem(it);
    });

    return this;
  }

  addMessage(message: IBatchMessage): BatchProcessDto {
    this._messages.push(message);

    return this;
  }

  get messages(): IBatchMessage[] {
    return this._messages;
  }

  set messages(messages: IBatchMessage[]) {
    this._messages = messages;
  }

  setBatchCursor(cursor: string, iterateOnly = false): void {
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

  getBatchCursor(defaultValue = ''): string {
    return this.getHeader(BATCH_CURSOR, defaultValue) as string;
  }

  removeBatchCursor(): void {
    this.removeHeader(BATCH_CURSOR);
    this._removeRelatedHeaders([ResultCode.BATCH_CURSOR_ONLY, ResultCode.BATCH_CURSOR_WITH_FOLLOWERS]);
  }

  setBridgeData(data: string) {
    this._data = data;
  }

  public getBridgeData(): unknown {
    return JSON.stringify(this._messages);
  }

  protected _clearData() {
    this.messages = [];
  }
}
