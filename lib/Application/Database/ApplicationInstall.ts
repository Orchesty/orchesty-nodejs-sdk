import { ignore, index } from 'mongodb-typescript';
import { DateTime } from 'luxon';
import DateTimeUtils, { DATE_TIME } from '../../Utils/DateTimeUtils';
import ADocument from '../../Storage/Mongodb/ADocument';

export interface IApplicationSettings {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
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

  public setUpdated(): ApplicationInstall {
    this.updated = DateTimeUtils.utcDate;
    return this;
  }

  public setDeleted(): ApplicationInstall {
    this.deleted = true;
    return this;
  }

  public getDeleted(): boolean {
    return this.deleted;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(user: string): ApplicationInstall {
    this.user = user;

    return this;
  }

  public getExpires(): Date | undefined {
    return this.expires;
  }

  public setExpires(expires?: Date): ApplicationInstall {
    this.expires = expires;
    return this;
  }

  public getName(): string {
    return this.key;
  }

  public setName(name: string): ApplicationInstall {
    this.key = name;

    return this;
  }

  public setSettings(settings: IApplicationSettings): ApplicationInstall {
    this.settings = settings;
    return this;
  }

  public setNonEncryptedSettings(nonEncryptedSettings: IApplicationSettings): ApplicationInstall {
    this.nonEncryptedSettings = nonEncryptedSettings;
    return this;
  }

  public setEncryptedSettings(encryptedSettings: string): ApplicationInstall {
    this.encryptedSettings = encryptedSettings;
    return this;
  }

  public addSettings(setting: IApplicationSettings): ApplicationInstall {
    this.settings = { ...this.settings, ...setting };
    return this;
  }

  public addNonEncryptedSettings(nonEncryptedSettings: IApplicationSettings): ApplicationInstall {
    this.nonEncryptedSettings = { ...this.nonEncryptedSettings, ...nonEncryptedSettings };
    return this;
  }

  public toArray = (): { [key: string]: unknown } => ({
    id: this._id?.toHexString() ?? '',
    user: this.user,
    key: this.key,
    settings: this.settings,
    nonEncryptedSettings: this.nonEncryptedSettings,
    created: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.created), DATE_TIME),
    update: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.updated), DATE_TIME),
    expires: this.expires ? DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.expires), DATE_TIME) : null,
  });
}
