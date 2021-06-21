/* eslint-disable @typescript-eslint/naming-convention */
import { ignore } from 'mongodb-typescript';
import DateTimeUtils, { DATE_TIME } from '../../Utils/DateTimeUtils';
import DocumentAbstract from '../../Storage/Mongodb/DocumentAbstract';

export interface IApplicationSettings {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export class ApplicationInstall extends DocumentAbstract {
  private deleted = false;

  private user = '';

  private key = '';

  private readonly created: Date;

  private readonly updated: Date;

  private expires?: Date;

  @ignore
  private settings: IApplicationSettings = {};

  private encryptedSettings = '';

  private nonEncryptedSettings: IApplicationSettings = {};

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

  public getKey(): string {
    return this.key;
  }

  public setKey(key: string): ApplicationInstall {
    this.key = key;

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
    created: DateTimeUtils.getFormattedDate(this.created, DATE_TIME),
    update: DateTimeUtils.getFormattedDate(this.updated, DATE_TIME),
    expires: this.expires ? DateTimeUtils.getFormattedDate(this.expires, DATE_TIME) : null,
  });
}
