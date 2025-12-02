import { Collection, Filter, FindOptions, IndexDescription, ObjectId } from 'mongodb';
import { MongoDb } from './MongoDb';

export abstract class AbstractRepository<T extends { id: string }> {

    protected readonly collection: Collection;

    protected readonly indices: IndexDescription[] = [];

    public constructor(client: MongoDb, collectionName: string) {
        this.collection = client.getCollection(collectionName);
    }

    public async findById(id: ObjectId | string): Promise<T | null> {
        return this.resultOrNull(
            this.collection.findOne({ _id: this.ensureObjectId(id) }),
        );
    }

    public async insert(document: T): Promise<T> {
        const result = await this.collection.insertOne(document);
        document.id = result.insertedId.toHexString();
        delete (document as Record<string, unknown>)._id;

        return document;
    }

    public async insertMany(documents: T[]): Promise<void> {
        await this.collection.insertMany(documents);
    }

    public async update(document: T): Promise<T> {
        await this.collection.updateOne({ _id: this.ensureObjectId(document.id) }, { $set: document });

        return document;
    }

    public async findOne(query: Filter<unknown>, options: FindOptions = {}): Promise<T | null> {
        return this.resultOrNull(
            this.collection.findOne(this.remapId(query), options),
        );
    }

    public async findMany(query: Filter<unknown>, options: FindOptions = {}): Promise<T[]> {
        const cursor = this.collection.find(this.remapId(query), options);
        const items = await cursor.toArray();

        // eslint-disable-next-line @typescript-eslint/await-thenable
        return Promise.all(items.map(async (it) => this.resultOrNull(it)) as unknown as T[]);
    }

    public async upsert(document: T): Promise<T> {
        const result = await this.collection.updateOne(
            { _id: this.ensureObjectId(document.id) },
            { $set: document },
            { upsert: true },
        );
        if (result.upsertedId) {
            document.id = result.upsertedId.toHexString();
        }

        return document;
    }

    public async upsertMany(documents: T[]): Promise<T[]> {
        const promises = documents.map(async (document) => this.upsert(document));

        return Promise.all(promises);
    }

    public async delete(filter: Filter<unknown>): Promise<void> {
        await this.collection.deleteMany(this.remapId(filter));
    }

    public async deleteAll(): Promise<void> {
        await this.collection.deleteMany({});
    }

    public async createIndices(): Promise<void> {
        if (this.indices.length) {
            await this.collection.createIndexes(this.indices);
        }
    }

    /*
        Helper methods for object management
     */

    protected ensureObjectId(id: ObjectId | string): ObjectId {
        if (typeof id === 'string') {
            return new ObjectId(id);
        }

        return id;
    }

    protected remapId(data: Record<string, unknown>): object {
        if ('id' in data) {
            data._id = this.ensureObjectId(data.id as ObjectId | string);
            delete data.id;
        }

        return data;
    }

    protected async resultOrNull(result: unknown): Promise<T | null> {
        const data = (await result) as Record<string, unknown> | null;
        if (data) {
            if ('_id' in data) {
                data.id = (data._id as ObjectId).toHexString();
                delete data._id;
            }

            return data as T;
        }

        return null;
    }

}
