import Repository from '../../Storage/Mongodb/Repository';

export default class ApplicationInstallRepository<ApplicationInstall> extends Repository<ApplicationInstall> {

    public async findByNameAndUser(name: string, user: string, enabled = true): Promise<ApplicationInstall | null> {
        return this.findOne({ key: name, user, enabled });
    }

    public async findOneByUser(user: string, enabled = true): Promise<ApplicationInstall | null> {
        return this.findOne({ user, enabled });
    }

    public async findOneByName(name: string, enabled = true): Promise<ApplicationInstall | null> {
        return this.findOne({ key: name, enabled });
    }

    public async findManyByUser(user: string, enabled = true): Promise<ApplicationInstall[] | null> {
        return this.findMany({ user, enabled });
    }

    public async findManyByName(name: string, enabled = true): Promise<ApplicationInstall[] | null> {
        return this.findMany({ key: name, enabled });
    }

}
