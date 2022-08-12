import AProcessDto from './AProcessDto';

export default class ProcessDto<JsonData = unknown> extends AProcessDto {
  get data(): string {
    return this._data;
  }

  set data(data: string) {
    this._data = data;
  }

  get jsonData(): JsonData {
    return JSON.parse(this._data || '{}');
  }

  set jsonData(body: unknown) {
    this._data = JSON.stringify(body);
  }

  public setNewJsonData<T>(body: T): ProcessDto<T> {
    this._data = JSON.stringify(body);

    return this as unknown as ProcessDto<T>;
  }
}
