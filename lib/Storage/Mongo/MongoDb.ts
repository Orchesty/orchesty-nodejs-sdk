import { Collection, MongoClient } from 'mongodb';

export class MongoDb {

    private readonly client: MongoClient;

    public constructor(dsn: string) {
        this.client = new MongoClient(dsn);
    }

    public async connect(): Promise<void> {
        await this.client.connect();
    }

    public async disconnect(): Promise<void> {
        return this.client.close();
    }

    public getCollection(collection: string): Collection {
        return this.client.db().collection(collection);
    }

}
