import AProcessDto from './AProcessDto';

export default class ProcessDto<JsonData = unknown> extends AProcessDto {

    public setData(data: string): this {
        this.data = data;

        return this;
    }

    public getJsonData(): JsonData {
        return JSON.parse(this.data || '{}');
    }

    public setJsonData(body: unknown): this {
        this.data = JSON.stringify(body);

        return this;
    }

    public setNewJsonData<T>(body: T): ProcessDto<T> {
        this.data = JSON.stringify(body);

        return this as unknown as ProcessDto<T>;
    }

}
