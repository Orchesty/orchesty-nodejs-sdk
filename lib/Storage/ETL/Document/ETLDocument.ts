import { index } from 'mongodb-typescript';
import DateTimeUtils from '../../../Utils/DateTimeUtils';
import ADocument from '../../Mongodb/ADocument';

export default class ETLDocument extends ADocument {
  /* eslint-disable @typescript-eslint/naming-convention */
  @index()
  private user = '';

  @index()
  private application = '';

  @index()
  private processId = '';

  @index(undefined, { expireAfterSeconds: 86400 })
  private readonly created: Date;

  private data = '';
  /* eslint-enable @typescript-eslint/naming-convention */

  public constructor() {
    super();
    this.created = DateTimeUtils.utcDate;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(user: string): this {
    this.user = user;

    return this;
  }

  public getApplication(): string {
    return this.application;
  }

  public setApplication(application: string): this {
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
