import deepmerge from 'deepmerge';
import { DateTime } from 'luxon';
import ADocument from '../../Storage/Mongodb/ADocument';
import DateTimeUtils, { DATE_TIME } from '../../Utils/DateTimeUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IApplicationSettings = Record<string, any>;

export class ApplicationInstall extends ADocument {

    private expires?: Date;

    private user = '';

    private key = '';

    private settings: IApplicationSettings = {};

    private enabled = false;

    private readonly created: Date;

    private updated: Date;

    private encryptedSettings = '';

    private nonEncryptedSettings: IApplicationSettings = {};

    public constructor() {
        super();
        this.created = DateTimeUtils.getUtcDate();
        this.updated = DateTimeUtils.getUtcDate();
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
        this.updated = DateTimeUtils.getUtcDate();
        return this;
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

    public setEnabled(enabled: boolean): this {
        this.enabled = enabled;

        return this;
    }

    public isEnabled(): boolean {
        return this.enabled;
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

    public toArray(): Record<string, unknown> {
        return {
            id: this.id,
            user: this.user,
            key: this.key,
            enabled: this.enabled,
            nonEncryptedSettings: this.nonEncryptedSettings,
            created: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.created), DATE_TIME),
            update: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.updated), DATE_TIME),
            expires: this.expires ? DateTimeUtils.getFormattedDate(DateTime.fromJSDate(this.expires), DATE_TIME) : null,
        };
    }

}
