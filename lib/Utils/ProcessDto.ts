import AProcessDto from './AProcessDto';

export default class ProcessDto extends AProcessDto {
  get data(): string {
    return this._data;
  }

  set data(data: string) {
    this._data = data;
  }

  get jsonData(): unknown {
    return JSON.parse(this._data || '{}');
  }

  set jsonData(body: unknown) {
    this._data = JSON.stringify(body);
  }
}
