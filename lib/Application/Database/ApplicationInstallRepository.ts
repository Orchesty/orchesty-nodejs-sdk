import Repository from '../../Storage/Mongodb/Repository';

export default class ApplicationInstallRepository<ApplicationInstall> extends Repository<ApplicationInstall> {

    public async findByNameAndUser(name: string, user: string): Promise<ApplicationInstall | null> {
        return this.findOne({ key: name, user });
    }

    public async findOneByUser(user: string): Promise<ApplicationInstall | null> {
        return this.findOne({ user });
    }

    public async findOneByName(name: string): Promise<ApplicationInstall | null> {
        return this.findOne({ key: name });
    }

    public async findManyByUser(user: string): Promise<ApplicationInstall[] | null> {
        return this.findMany({ user });
    }

    public async findManyByName(name: string): Promise<ApplicationInstall[] | null> {
        return this.findMany({ key: name });
    }

}
