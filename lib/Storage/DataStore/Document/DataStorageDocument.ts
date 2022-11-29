import DateTimeUtils from '../../../Utils/DateTimeUtils';

export default class DataStorageDocument<T = unknown> {

    private user?: string = '';

    private application?: string = '';

    private data?: T;

    private created: Date;

    public constructor() {
        this.created = DateTimeUtils.getUtcDate();
    }

    public static fromJson<T>(data: IDataStorageDocument<T>): DataStorageDocument<T> {
        const document = new DataStorageDocument<T>();
        document.setUser(data.user);
        document.setApplication(data.application);
        document.setCreated(data.created);
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

    private setCreated(date: Date): this {
        this.created = date;

        return this;
    }

}

export interface IDataStorageDocument<T> {
    user?: string;
    application?: string;
    data?: T;
    created: Date;
}
