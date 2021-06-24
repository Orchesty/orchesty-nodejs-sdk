import { Db, MongoClient } from 'mongodb';
import { ClassType } from 'mongodb-typescript';
import logger from '../../Logger/Logger';
import { IDocument } from './DocumentAbstract';
import Repository from './Repository';
import CryptManager from '../../Crypt/CryptManager';

export default class MongoDbClient {
  private readonly _client: MongoClient

  constructor(private _dsn: string, private _cryptManager: CryptManager) {
    this._client = new MongoClient(this._dsn, { useUnifiedTopology: true });
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
      logger.error(err.message);
    }
  }

  public async db(name?: string): Promise<Db> {
    if (!this._client.isConnected()) {
      await this.reconnect();
    }

    return this._client.db(name);
  }

  public async getRepository(className: ClassType<IDocument>): Promise<Repository<unknown>> {
    if (!this._client.isConnected()) {
      await this.reconnect();
    }

    return new Repository(
      className,
      this._client,
      (className as unknown as IDocument).getCollection(),
      this._cryptManager,
    );
  }
}
