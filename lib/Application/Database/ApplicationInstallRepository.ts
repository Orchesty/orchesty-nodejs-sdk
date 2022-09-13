import Repository from '../../Storage/Mongodb/Repository';

export default class ApplicationInstallRepository<ApplicationInstall> extends Repository<ApplicationInstall> {

    public async findByNameAndUser(
        name: string,
        user: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall | null> {
        let q: { key: string; user: string; enabled?: boolean } = { key: name, user };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findOne(q);
    }

    public async findOneByUser(user: string, enabled: boolean | null = true): Promise<ApplicationInstall | null> {
        let q: { user: string; enabled?: boolean } = { user };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findOne(q);
    }

    public async findOneByName(name: string, enabled: boolean | null = true): Promise<ApplicationInstall | null> {
        let q: { key: string; enabled?: boolean } = { key: name };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findOne(q);
    }

    public async findManyByUser(
        user: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall[] | null> {
        let q: { user: string; enabled?: boolean } = { user };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findMany(q);
    }

    public async findManyByName(
        name: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall[] | null> {
        let q: { key: string;enabled?: boolean } = { key: name };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findMany(q);
    }

}
