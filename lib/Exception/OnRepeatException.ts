export default class OnRepeatException extends Error {
  // interval in seconds
  private _interval: number;

  constructor(seconds = 60, private _maxHops: number = 10, message?: string) {
    super(message);

    this._interval = seconds;
  }

  public getInterval(): number {
    return this._interval;
  }

  public setInterval(seconds: number): void {
    this._interval = seconds;
  }

  public getMaxHops(): number {
    return this._maxHops;
  }

  public setMaxHops(value: number): void {
    this._maxHops = value;
  }
}
