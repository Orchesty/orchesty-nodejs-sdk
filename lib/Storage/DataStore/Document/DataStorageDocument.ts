// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { index } from 'mongodb-typescript';
import DateTimeUtils from '../../../Utils/DateTimeUtils';
import ADocument from '../../Mongodb/ADocument';

export default class DataStorageDocument extends ADocument {

    @index()
    private user?: string = '';

    @index()
    private application?: string = '';

    @index()
    private processId = '';

    @index(undefined, { expireAfterSeconds: 86400 })
    private readonly created: Date;

    private data = '';

    public constructor() {
        super();
        this.created = DateTimeUtils.getUtcDate();
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

    public getProcessId(): string {
        return this.processId;
    }

    public setProcessId(processId: string): this {
        this.processId = processId;

        return this;
    }

    public getCreated(): Date {
        return this.created;
    }

    public getData(): unknown {
        return JSON.parse(this.data);
    }

    public setData(jsonData: unknown): this {
        this.data = JSON.stringify(jsonData);

        return this;
    }

}
