export default class OnRepeatException extends Error {

    // Interval in seconds
    private interval: number;

    public constructor(seconds = 60, private maxHops: number = 10, message?: string) {
        super(message);

        this.interval = seconds;
    }

    public getInterval(): number {
        return this.interval;
    }

    public setInterval(seconds: number): void {
        this.interval = seconds;
    }

    public getMaxHops(): number {
        return this.maxHops;
    }

    public setMaxHops(value: number): void {
        this.maxHops = value;
    }

}
