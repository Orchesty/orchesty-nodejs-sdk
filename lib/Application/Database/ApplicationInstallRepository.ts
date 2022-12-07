import Repository, { IPaging, IQueryFilter, IQuerySorter } from '../../Storage/Mongodb/Repository';
import { ApplicationInstall } from './ApplicationInstall';

export interface IApplicationInstallQueryFilter extends IQueryFilter {
    keys?: string[];
    users?: string[];
    expires?: number;
    nonEncrypt?: unknown;
    enabled: boolean | null;
}

export interface IApplicationInstallQuery {
    sorter?: IQuerySorter;
    paging?: IPaging;
    filter?: IApplicationInstallQueryFilter;

}

export default class ApplicationInstallRepository extends Repository<ApplicationInstall, IApplicationInstallQuery> {

    public async findByNameAndUser(
        name: string,
        user: string,
        enabled: boolean | null = null,
    ): Promise<ApplicationInstall | undefined> {
        return this.findOne({ filter: { users: [user], enabled, keys: [name] } });
    }

    public async findOneByUser(user: string, enabled: boolean | null = null): Promise<ApplicationInstall | undefined> {
        return this.findOne({ filter: { users: [user], enabled } });
    }

    public async findOneByName(name: string, enabled: boolean | null = null): Promise<ApplicationInstall | undefined> {
        return this.findOne({ filter: { keys: [name], enabled } });
    }

    public async findManyByUser(
        user: string,
        enabled: boolean | null = null,
    ): Promise<ApplicationInstall[]> {
        return this.findMany({ filter: { users: [user], enabled } });
    }

    public async findManyByName(
        name: string,
        enabled: boolean | null = null,
    ): Promise<ApplicationInstall[]> {
        return this.findMany({ filter: { keys: [name], enabled } });
    }

    public fromObject(object: unknown): ApplicationInstall {
        const applicationInstall = new ApplicationInstall();
        return applicationInstall.fromObject<ApplicationInstall>(applicationInstall, object);
    }

    protected encrypt(entity: ApplicationInstall): void {
        if (Object.keys(entity.getSettings()).length) {
            const encrypted = this.crypt.encrypt(entity.getSettings());
            entity.setEncryptedSettings(encrypted);
            entity.setUpdated();
        }
    }

    protected decrypt(entity: ApplicationInstall): void {
        if (entity.getEncryptedSettings()) {
            const decrypted = this.crypt.decrypt(entity.getEncryptedSettings());
            entity.setSettings(decrypted);
            entity.setEncryptedSettings('');
        }
    }

}
