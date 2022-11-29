import Repository from '../../Storage/Mongodb/Repository';

export default class ApplicationInstallRepository<ApplicationInstall> extends Repository<ApplicationInstall> {

    public async findByNameAndUser(
        name: string,
        user: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall | null> {
        let q: { enabled?: boolean; key: string; user: string } = { key: name, user };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findOne(q);
    }

    public async findOneByUser(user: string, enabled: boolean | null = true): Promise<ApplicationInstall | null> {
        let q: { enabled?: boolean; user: string } = { user };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findOne(q);
    }

    public async findOneByName(name: string, enabled: boolean | null = true): Promise<ApplicationInstall | null> {
        let q: { enabled?: boolean; key: string } = { key: name };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findOne(q);
    }

    public async findManyByUser(
        user: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall[] | null> {
        let q: { enabled?: boolean; user: string } = { user };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findMany(q);
    }

    public async findManyByName(
        name: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall[] | null> {
        let q: { enabled?: boolean; key: string } = { key: name };
        if (enabled !== null) {
            q = { ...q, enabled };
        }

        return this.findMany(q);
    }

}
