import AProcessDto from './AProcessDto';

export default class ProcessDto<JsonData = unknown> extends AProcessDto {

    public get data(): string {
        return this.clData;
    }

    public set data(data: string) {
        this.clData = data;
    }

    public get jsonData(): JsonData {
        return JSON.parse(this.clData || '{}');
    }

    public set jsonData(body: unknown) {
        this.clData = JSON.stringify(body);
    }

    public setNewJsonData<T>(body: T): ProcessDto<T> {
        this.clData = JSON.stringify(body);

        return this as unknown as ProcessDto<T>;
    }

}
