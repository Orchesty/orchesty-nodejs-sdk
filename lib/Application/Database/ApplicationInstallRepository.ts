import CryptManager from '../../Crypt/CryptManager';
import { ClassType } from '../../Storage/Mongodb/ADocument';
import Repository, { IFilter, IPaging, ISorter } from '../../Storage/Mongodb/Repository';
import Client from '../../Worker-api/Client';
import { ApplicationInstall } from './ApplicationInstall';

export interface IApplicationInstallQueryFilter extends IFilter {
    enabled: boolean | null;
    names?: string[];
    users?: string[];
    expires?: number;
    nonEncrypt?: Record<string, unknown>;
}

export default class ApplicationInstallRepository
    extends Repository<ApplicationInstall, IApplicationInstallQueryFilter> {

    public constructor(
        collection: ClassType<ApplicationInstall>,
        client: Client,
        private readonly crypt: CryptManager,
    ) {
        super(collection, client);
    }

    public async findByNameAndUser(
        name: string,
        user: string,
        enabled: boolean | null = true,
        deleted?: boolean,
    ): Promise<ApplicationInstall | undefined> {
        return this.findOne({ users: [user], enabled, names: [name], deleted });
    }

    public async findOneByUser(
        user: string,
        enabled: boolean | null = true,
        deleted?: boolean,
    ): Promise<ApplicationInstall | undefined> {
        return this.findOne({ users: [user], enabled, deleted });
    }

    public async findOneByName(
        name: string,
        enabled: boolean | null = true,
        deleted?: boolean,
    ): Promise<ApplicationInstall | undefined> {
        return this.findOne({ names: [name], enabled, deleted });
    }

    public async findManyByUser(
        user: string,
        enabled: boolean | null = true,
        deleted?: boolean,
        sorter?: ISorter,
        paging?: IPaging,
    ): Promise<ApplicationInstall[]> {
        return this.findMany({ users: [user], enabled, deleted }, sorter, paging);
    }

    public async findManyByName(
        name: string,
        enabled: boolean | null = true,
        deleted?: boolean,
        paging?: IPaging,
        sorter?: ISorter,
    ): Promise<ApplicationInstall[]> {
        return this.findMany({ names: [name], enabled, deleted }, sorter, paging);
    }

    public fromObject(object: unknown): ApplicationInstall {
        const applicationInstall = new ApplicationInstall();
        return applicationInstall.fromObject<ApplicationInstall>(applicationInstall, object);
    }

    protected beforeSend(entity: ApplicationInstall): this {
        if (Object.keys(entity.getSettings()).length) {
            const encrypted = this.crypt.encrypt(entity.getSettings());
            entity.setEncryptedSettings(encrypted);
            entity.setUpdated();
        }

        return this;
    }

    protected afterReceive(entity: ApplicationInstall): this {
        if (entity.getEncryptedSettings()) {
            const decrypted = this.crypt.decrypt(entity.getEncryptedSettings());
            entity.setSettings(decrypted);
            entity.setEncryptedSettings('');
        }

        return this;
    }

}
