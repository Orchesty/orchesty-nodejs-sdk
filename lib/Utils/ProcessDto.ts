import AProcessDto from './AProcessDto';

export default class ProcessDto<JsonData = unknown> extends AProcessDto {
  public get data(): string {
    return this._data;
  }

  public set data(data: string) {
    this._data = data;
  }

  public get jsonData(): JsonData {
    return JSON.parse(this._data || '{}');
  }

  public set jsonData(body: unknown) {
    this._data = JSON.stringify(body);
  }
}
