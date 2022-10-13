import { Filter, FindCursor, MongoClient, ObjectId, ReplaceOptions } from 'mongodb';
import { dehydrate, Repository as BaseRepo } from 'mongodb-typescript';
import { ClassType, RepositoryOptions } from 'mongodb-typescript/lib/repository';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import CryptManager from '../../Crypt/CryptManager';
import filters from './Filters';
import { IQueryFilter } from './Filters/AQueryFilter';

export default class Repository<T> extends BaseRepo<T> {

    private readonly filters: Record<string, IQueryFilter>;

    public constructor(
        Type: ClassType<T>,
        mongo: MongoClient,
        collection: string,
        private readonly crypt: CryptManager,
        options?: RepositoryOptions,
    ) {
        super(Type, mongo, collection, options);
        this.filters = filters;
    }

    public getName(): string {
        return this.Type.name;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async insert(entity: T): Promise<void> {
        this.encrypt(entity);
        return super.insert(entity);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async insertMany(entities: T[]): Promise<void> {
        const plain = entities.map((entity) => dehydrate<T>(entity));
        await this.collection.insertMany(plain);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async update(entity: T, options?: ReplaceOptions): Promise<void> {
        this.encrypt(entity);
        return super.update(entity, options);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async upsert(entity: T): Promise<void> {
        this.encrypt(entity);
        return super.save(entity);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async findMany(query: Filter<any>, skip: number | null = null, limit: number | null = null): Promise<T[]> {
        this.decorateQuery(query);
        let find = super.find(query);
        if (skip !== null) {
            find = find.skip(skip);
        }
        if (limit !== null) {
            find = find.limit(limit);
        }
        const entities = await find.toArray();

        entities.forEach((entity) => {
            this.decrypt(entity);
        });
        return entities;
    }

    /* eslint-disable */
    public find = (query: Filter<T>): FindCursor<T> => {
        throw new Error('Use findMany method!');
    };
    /* eslint-enable */

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async findOne(query?: Filter<any>): Promise<T | null> {
        this.decorateQuery(query);
        const entity = await super.findOne(query);
        if (entity) {
            this.decrypt(entity);
        }
        return entity;
    }

    public async findById(id: ObjectId): Promise<T | null> {
        const query = { _id: id };
        this.decorateQuery(query);
        const entity = await super.findOne(query);
        if (entity) {
            this.decrypt(entity);
        }
        return entity;
    }

    public async findManyById(ids: ObjectId[]): Promise<T[]> {
        const query = { _id: { $in: ids } };
        this.decorateQuery(query);
        const entities = await super.find(query)
            .toArray();
        if (entities) {
            entities.forEach((entity) => {
                this.decrypt(entity);
            });
        }
        return entities;
    }

    public async remove(entity: T): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (Object.hasOwn(entity as any, 'deleted')) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
            await this.update((entity as any).setDeleted());
        } else {
            await super.remove(entity);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async removeMany(query: Filter<any>): Promise<void> {
        await this.collection.deleteMany(query);
    }

    public enableFilter(name: string): void {
        if (!Object.hasOwn(this.filters, name)) {
            throw new Error('This filter doesn´t exist');
        }
        this.filters[name].active(true);
    }

    public disableFilter(name: string): void {
        if (!Object.hasOwn(this.filters, name)) {
            throw new Error('This filter doesn´t exist');
        }
        this.filters[name].active(false);
    }

    private encrypt(entity: T): void {
        if (Object.hasOwn(entity as unknown as ApplicationInstall, 'settings')
            && Object.hasOwn(entity as unknown as ApplicationInstall, 'encryptedSettings')
        ) {
            const encrypted = this.crypt.encrypt((entity as unknown as ApplicationInstall).getSettings());
            ((entity as unknown as ApplicationInstall)).setEncryptedSettings(encrypted);
            ((entity as unknown as ApplicationInstall)).setUpdated();
        }
    }

    private decrypt(entity: T): void {
        if (Object.hasOwn(entity as unknown as object, 'settings')
            && Object.hasOwn(entity as unknown as object, 'encryptedSettings')
        ) {
            const decrypted = this.crypt.decrypt((entity as unknown as ApplicationInstall).getEncryptedSettings());
            ((entity as unknown as ApplicationInstall)).setSettings(decrypted);
            ((entity as unknown as ApplicationInstall)).setEncryptedSettings('');
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private decorateQuery(query?: Filter<any>): void {
        Object.entries(this.filters)
            .forEach((item) => {
                item[1].decorate(this.Type, query);
            });
    }

}
