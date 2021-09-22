import Repository from '../../Storage/Mongodb/Repository';

export default class ApplicationInstallRepository<ApplicationInstall> extends Repository<ApplicationInstall> {

  public async findByNameAndUser(name: string, user?: string): Promise<ApplicationInstall | null> {
    if (user) {
      return this.findOne({ key: name, user });
    }

    return this.findOne({ key: name });
  }
}
