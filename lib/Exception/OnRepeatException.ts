import ProcessDTO from '../Utils/ProcessDTO';

export default class OnRepeatException extends Error {
    private _interval: number;

    private _maxHops: number;

    constructor(private _dto: ProcessDTO, message?: string) {
      super(message);

      this._interval = 60000;
      this._maxHops = 10;
    }

    public getDto(): ProcessDTO {
      return this._dto;
    }

    public setDto(value: ProcessDTO): void {
      this._dto = value;
    }

    public getInterval(): number {
      return this._interval;
    }

    public setInterval(value: number): void {
      this._interval = value;
    }

    public getMaxHops(): number {
      return this._maxHops;
    }

    public setMaxHops(value: number): void {
      this._maxHops = value;
    }
}
