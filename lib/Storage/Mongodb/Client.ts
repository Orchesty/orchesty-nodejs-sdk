import { Db, MongoClient } from 'mongodb';
import { ClassType } from 'mongodb-typescript';
import logger from '../../Logger/Logger';
import { IDocument } from './DocumentAbstract';
import Repository from './Repository';
import CryptManager from '../../Crypt/CryptManager';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import DIContainer from '../../DIContainer/Container';

export default class MongoDbClient {
  private readonly _client: MongoClient

  constructor(private _dsn: string, private _cryptManager: CryptManager, private container: DIContainer) {
    this._client = new MongoClient(this._dsn, {
      useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 10000, keepAlive: true,
    });
  }

  get client() {
    return this._client;
  }

  public async down(): Promise<void> {
    await this._client.close(true);
  }

  public isConnected(): boolean {
    return this._client.isConnected();
  }

  public async reconnect(): Promise<void> {
    try {
      await this._client.connect();
      logger.info('⚡️[server]: MongoDB Connected.');
    } catch (err) {
      if (err instanceof Error) logger.error(err.message);
    }
  }

  public async db(name?: string): Promise<Db> {
    if (!this._client.isConnected()) {
      await this.reconnect();
    }

    return this._client.db(name);
  }

  public async getRepository<T extends IDocument>(className: ClassType<T>): Promise<Repository<T>> {
    if (!this._client.isConnected()) {
      await this.reconnect();
    }

    try {
      const repo = this.container.getRepository(className);
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
