import MongoDbClient from '../Mongodb/Client';
import ETLDocument from './Document/ETLDocument';

export default class ETLManager {
  public constructor(private _db: MongoDbClient) {}

  public async getData(user: string, application: string, processId: string): Promise<ETLDocument[]> {
    return (await this._db.getRepository(ETLDocument))
      .findMany({ user, application, processId });
  }

  public async storeData(user: string, application: string, processId: string, data: unknown[]): Promise<void> {
    const entities = data.map((item) => new ETLDocument()
      .setUser(user)
      .setApplication(application)
      .setProcessId(processId)
      .setData(item));
    await (await this._db.getRepository(ETLDocument)).insertMany(entities);
  }

  public async removeData(user: string, application: string, processId: string): Promise<void> {
    await (await this._db.getRepository(ETLDocument)).removeMany({ user, application, processId });
  }
}
