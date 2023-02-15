import { Collection, Filter, FindOptions, IndexDescription, ObjectId } from 'mongodb';
import { MongoDb } from './MongoDb';

export abstract class Repository<T extends { _id: ObjectId }> {

    protected readonly collection: Collection;

    protected readonly indices: IndexDescription[] = [];

    public constructor(client: MongoDb, collectionName: string) {
        this.collection = client.getCollection(collectionName);
    }

    public async get(id: ObjectId | string): Promise<T | null> {
        return this.collection.findOne({ _id: this.ensureObjectId(id) }) as unknown as Promise<T | null>;
    }

    public async insert(document: T): Promise<T> {
        const result = await this.collection.insertOne(document);
        document._id = result.insertedId;

        return document;
    }

    public async insertMany(documents: T[]): Promise<void> {
        await this.collection.insertMany(documents);
    }

    public async update(document: T): Promise<T> {
        await this.collection.updateOne({ _id: document._id }, { $set: document });

        return document;
    }

    public async findOne(query: Filter<unknown>, options: FindOptions = {}): Promise<T> {
        const result = await this.collection.findOne(query, options);

        return result as T;
    }

    public async find(query: Filter<unknown>, options: FindOptions = {}): Promise<T[]> {
        const cursor = this.collection.find(query, options);

        return await cursor.toArray() as T[];
    }

    public async upsert(document: T): Promise<T> {
        const result = await this.collection.updateOne({ _id: document._id }, { $set: document }, { upsert: true });
        if (result.upsertedId) {
            document._id = result.upsertedId;
        }

        return document;
    }

    public async delete(filter: Filter<unknown>): Promise<void> {
        await this.collection.deleteMany(filter);
    }

    public async deleteAll(): Promise<void> {
        await this.collection.deleteMany({});
    }

    public async createIndices(): Promise<void> {
        if (this.indices.length) {
            await this.collection.createIndexes(this.indices);
        }
    }

    private ensureObjectId(id: ObjectId | string): ObjectId {
        if (typeof id === 'string') {
            return new ObjectId(id);
        }

        return id;
    }

}
