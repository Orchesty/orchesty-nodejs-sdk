import MongoDbClient from '../Mongodb/Client';
import DataStorageDocument from './Document/DataStorageDocument';

export default class DataStorageManager {

    public constructor(private readonly db: MongoDbClient) {
    }

    public async load(
        id: string,
        application?: string,
        user?: string,
        skip: number | null = null,
        limit: number | null = null,
    ): Promise<DataStorageDocument[]> {
        return (await this.db.getRepository(DataStorageDocument))
            .findMany({ user, application, processId: id }, skip, limit);
    }

    public async store(id: string, data: unknown[], application?: string, user?: string): Promise<void> {
        const entities = data.map((item) => new DataStorageDocument()
            .setUser(user)
            .setApplication(application)
            .setProcessId(id)
            .setData(item));
        await (await this.db.getRepository(DataStorageDocument)).insertMany(entities);
    }

    public async remove(id: string, application?: string, user?: string): Promise<void> {
        await (await this.db.getRepository(DataStorageDocument))
            .removeMany({ user, application, processId: id });
    }

}
