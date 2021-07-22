import { ICommonNode } from './ICommonNode';
import { ApplicationInstall } from '../Application/Database/ApplicationInstall';
import MongoDbClient from '../Storage/Mongodb/Client';
import { IApplication } from '../Application/Base/IApplication';
import ProcessDto from '../Utils/ProcessDto';

export default abstract class ACommonNode implements ICommonNode {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private application?: IApplication;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private db?: MongoDbClient;

  public abstract processAction(dto: ProcessDto): Promise<ProcessDto> | ProcessDto;

  public abstract getName(): string;

  public setApplication(application: IApplication): ACommonNode {
    this.application = application;

    return this;
  }

  public setDb(db: MongoDbClient): ACommonNode {
    this.db = db;

    return this;
  }

  protected get _application(): IApplication {
    if (this.application) {
      return this.application;
    }

    throw new Error('Application has not set.');
  }

  protected get _dbClient(): MongoDbClient {
    if (this.db) {
      return this.db;
    }

    throw new Error('MongoDbClient has not set.');
  }

  protected async _getApplicationInstall(user: string): Promise<ApplicationInstall> {
    const repo = await this._dbClient.getApplicationRepository();
    const appInstall = await repo.findByNameAndUser(this._application.getName(), user);

    if (!appInstall) {
      throw new Error(
        `ApplicationInstall with user [${user}] and name [${this._application.getName()}] has not found!`,
      );
    }

    return appInstall;
  }
}
