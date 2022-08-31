import MongoDbClient from '../Mongodb/Client';
import DataStorageDocument from './Document/DataStorageDocument';

export default class DataStorageManager {

    public constructor(private readonly db: MongoDbClient) {
    }

    public async load(user: string, application: string, processId: string): Promise<DataStorageDocument[]> {
        return (await this.db.getRepository(DataStorageDocument))
            .findMany({ user, application, processId });
    }

    public async store(user: string, application: string, processId: string, data: unknown[]): Promise<void> {
        const entities = data.map((item) => new DataStorageDocument()
            .setUser(user)
            .setApplication(application)
            .setProcessId(processId)
            .setData(item));
        await (await this.db.getRepository(DataStorageDocument)).insertMany(entities);
    }

    public async remove(user: string, application: string, processId: string): Promise<void> {
        await (await this.db.getRepository(DataStorageDocument)).removeMany({ user, application, processId });
    }

}
