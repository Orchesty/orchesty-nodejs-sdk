import { ICommonNode } from '../Commons/ICommonNode';
import { IApplication } from '../Application/Base/IApplication';
import ProcessDto from '../Utils/ProcessDto';
import { ApplicationInstall } from '../Application/Database/ApplicationInstall';
import MongoDbClient from '../Storage/Mongodb/Client';
import CurlSender from '../Transport/Curl/CurlSender';

export default abstract class AConnector implements ICommonNode {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private application?: IApplication

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private db?: MongoDbClient

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private sender?: CurlSender

  public abstract processAction(dto: ProcessDto): Promise<ProcessDto>|ProcessDto;

  public abstract getName(): string;

  public setApplication(application: IApplication): AConnector {
    this.application = application;

    return this;
  }

  public setDb(db: MongoDbClient): AConnector {
    this.db = db;

    return this;
  }

  public setSender(sender: CurlSender): AConnector {
    this.sender = sender;

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

  protected get _sender(): CurlSender {
    if (this.sender) {
      return this.sender;
    }

    throw new Error('CurlSender has not set.');
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
