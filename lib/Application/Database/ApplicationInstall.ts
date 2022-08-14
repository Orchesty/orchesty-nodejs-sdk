import deepmerge from 'deepmerge';
import { DateTime } from 'luxon';
import { ignore, index } from 'mongodb-typescript';
import ADocument from '../../Storage/Mongodb/ADocument';
import DateTimeUtils, { DATE_TIME } from '../../Utils/DateTimeUtils';

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface IApplicationSettings {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class ApplicationInstall extends ADocument {
  /* eslint-disable @typescript-eslint/naming-convention */
  private deleted = false;

  @index()
  private user = '';

  @index()
  private key = '';

  private readonly created: Date;

  private updated: Date;

  @index()
  private expires?: Date;

  @ignore
  private settings: IApplicationSettings = {};

  private encryptedSettings = '';

  private nonEncryptedSettings: IApplicationSettings = {};
  /* eslint-enable @typescript-eslint/naming-convention */

  public constructor() {
    super();
    this.created = DateTimeUtils.utcDate;
    this.updated = DateTimeUtils.utcDate;
  }

  public getSettings(): IApplicationSettings {
    return this.settings;
  }

  public getEncryptedSettings(): string {
    return this.encryptedSettings;
  }

  public getNonEncryptedSettings(): IApplicationSettings {
    return this.nonEncryptedSettings;
  }

  public getCreated(): Date {
    return this.created;
  }

  public getUpdated(): Date {
    return this.updated;
  }

  public setUpdated(): this {
    this.updated = DateTimeUtils.utcDate;
    return this;
  }

  public setDeleted(deleted = true): this {
    this.deleted = deleted;
    return this;
  }

  public getDeleted(): boolean {
    return this.deleted;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(user: string): this {
    this.user = user;

    return this;
  }

  public getExpires(): Date | undefined {
    return this.expires;
  }

  public setExpires(expires?: Date): this {
    this.expires = expires;
    return this;
  }

  public getName(): string {
    return this.key;
  }

  public setName(name: string): this {
    this.key = name;

    return this;
  }

  public setSettings(settings: IApplicationSettings): this {
    this.settings = settings;
    return this;
  }

  public setNonEncryptedSettings(nonEncryptedSettings: IApplicationSettings): this {
    this.nonEncryptedSettings = nonEncryptedSettings;
    return this;
  }

  public setEncryptedSettings(encryptedSettings: string): this {
    this.encryptedSettings = encryptedSettings;
    return this;
  }

  public addSettings(setting: IApplicationSettings): this {
    this.settings = deepmerge(this.settings, setting);
    return this;
  }

  public addNonEncryptedSettings(nonEncryptedSettings: IApplicationSettings): this {
    this.nonEncryptedSettings = deepmerge(this.nonEncryptedSettings, nonEncryptedSettings);
    return this;
  }

  public toArray = (): Record<string, unknown> => ({
    id: this._id?.toHexString() ?? '',
    user: this.user,
    key: this.key,
    // settings: this.settings,
    nonEncryptedSettings: this.nonEncryptedSettings,
    created: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.created), DATE_TIME),
    update: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.updated), DATE_TIME),
    expires: this.expires ? DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.expires), DATE_TIME) : null,
  });
}
