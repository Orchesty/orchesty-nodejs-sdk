import CryptManager from '../../Crypt/CryptManager';
import ADocument, { ClassType } from '../../Storage/Database/ADocument';
import DatabaseClient from '../../Storage/Database/Client';
import Repository, { IFilter, IPaging, ISorter } from '../../Storage/Database/Repository';
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
        client: DatabaseClient,
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

    public async remove(entity: ApplicationInstall): Promise<this> {
        await this.removeMany(
            { ids: [(entity as ADocument).getId()], enabled: null } as IApplicationInstallQueryFilter,
        );
        return this;
    }

    protected beforeSend(entity: ApplicationInstall): this {
        if (Object.keys(entity.getSettings()).length) {
            const encrypted = this.crypt.encrypt(entity.getSettings());
            entity.setEncryptedSettings(encrypted);
            entity.setUpdated();
            entity.setSettings({});
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
