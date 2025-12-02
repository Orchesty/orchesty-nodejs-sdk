import DateTimeUtils from '../../../Utils/DateTimeUtils';

export default class DataStorageDocument<T = unknown> {

    private readonly created: Date;

    private user?: string = '';

    private application?: string = '';

    private data?: T;

    public constructor(date?: Date) {
        this.created = date ?? DateTimeUtils.getUtcDate();
    }

    public static fromJson<T>(data: IDataStorageDocument<T>): DataStorageDocument<T> {
        const document = new DataStorageDocument<T>(data.created);
        document.setUser(data.user);
        document.setApplication(data.application);
        document.setData(data.data);

        return document;
    }

    public getUser(): string | undefined {
        return this.user;
    }

    public setUser(user?: string): this {
        this.user = user;

        return this;
    }

    public getApplication(): string | undefined {
        return this.application;
    }

    public setApplication(application?: string): this {
        this.application = application;

        return this;
    }

    public getCreated(): Date {
        return this.created;
    }

    public getData(): T | undefined {
        return this.data;
    }

    public setData(data?: T): this {
        this.data = data;

        return this;
    }

}

export interface IDataStorageDocument<T> {
    created: Date;
    user?: string;
    application?: string;
    data?: T;

}
