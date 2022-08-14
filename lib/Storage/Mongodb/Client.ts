import { Db, MongoClient } from 'mongodb';
import { ClassType } from 'mongodb-typescript';
import logger from '../../Logger/Logger';
import { IDocument } from './ADocument';
import Repository from './Repository';
import CryptManager from '../../Crypt/CryptManager';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import DIContainer from '../../DIContainer/Container';

export default class MongoDbClient {
  private readonly _client: MongoClient;

  public constructor(private readonly _dsn: string, private readonly _cryptManager: CryptManager, private readonly _container: DIContainer) {
    this._client = new MongoClient(this._dsn, { connectTimeoutMS: 10000, keepAlive: true });
  }

  public get client(): MongoClient {
    return this._client;
  }

  public async down(): Promise<void> {
    await this._client.close(true);
  }

  public async reconnect(): Promise<void> {
    try {
      await this._client.connect();
      logger.info('⚡️[server]: MongoDB Connected.', {});
    } catch (err) {
      if (err instanceof Error) logger.error(err.message, {});
    }
  }

  public async db(name?: string): Promise<Db> {
    await this._client.connect();

    return this._client.db(name);
  }

  public async getRepository<T extends IDocument>(className: ClassType<T>): Promise<Repository<T>> {
    try {
      const repo = this._container.getRepository(className);
      await repo.createIndexes(true);

      return repo;
    } catch (e) {
      // Ignore and create new repo
    }

    const repo = new Repository(
      className,
      this._client,
      (className as unknown as IDocument).getCollection(),
      this._cryptManager,
    );
    await repo.createIndexes(true);

    return repo;
  }

  public async getApplicationRepository(): Promise<ApplicationInstallRepository<ApplicationInstall>> {
    return await this.getRepository(ApplicationInstall) as ApplicationInstallRepository<ApplicationInstall>;
  }
}
