import crypto from 'crypto';
import NodeCache from 'node-cache';
import CryptManager from '../../Crypt/CryptManager';
import { HttpMethods } from '../../Transport/HttpMethods';
import Client from '../../Worker-api/Client';
import ADocument, { ClassType } from './ADocument';

const STD_TTL = 1;

export interface IQuerySorter {
    created: 'asc' | 'desc';
}

export interface IQueryFilter {
    ids?: string[];
}

export interface IPaging {
    limit?: number;
    offset?: number;
}

export interface IQuery {
    sorter?: IQuerySorter;
    paging?: IPaging;
    filter?: IQueryFilter;
}

interface IRepository<T> {
    fromObject(object: unknown): T;
}

export default class Repository<T, Q extends IQuery> implements IRepository<T> {

    public collection: string;

    private readonly cache: NodeCache;

    public constructor(
        collection: ClassType<T>,
        protected client: Client,
        protected readonly crypt: CryptManager,
    ) {
        this.cache = new NodeCache({ stdTTL: STD_TTL, checkperiod: 1 });
        this.collection = collection.getCollection();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public fromObject(object: unknown): T {
        throw new Error('Method not implemented.');
    }

    public clearCache(): void {
        this.cache.flushAll();
    }

    public async insert(entity: T): Promise<void> {
        return this.insertMany([entity]);
    }

    public async insertMany(entities: T[]): Promise<void> {
        entities.forEach((entity) => this.encrypt(entity));
        await this.client.send(`/document/${this.collection}`, HttpMethods.POST, entities);
        this.clearCache();
    }

    public async update(entity: T): Promise<void> {
        return this.insertMany([entity]);
    }

    public async findById(id: string): Promise<T | undefined> {
        return this.findOne({ filter: { ids: [id] } } as Q);
    }

    public async findOne(query?: Q): Promise<T | undefined> {
        return (await this.findMany(query))?.[0];
    }

    public async findManyById(ids: string[]): Promise<T[]> {
        return this.findMany({ filter: { ids } } as Q);
    }

    public async findMany(query?: Q): Promise<T[]> {
        const cacheRecord = this.findInCache<T[]>(query);
        if (cacheRecord) {
            return cacheRecord;
        }

        let queryParams = '';
        if (query) {
            queryParams = this.decorateQuery(queryParams, 'filter', query.filter);
            queryParams = this.decorateQuery(queryParams, 'sorter', query.sorter);
            queryParams = this.decorateQuery(queryParams, 'paging', query.paging);
        }

        const find = (await this.client.send(`/document/${this.collection}${queryParams}`, HttpMethods.GET)).data;

        if (!find) {
            return [];
        }

        const entities: T[] = find.map((item: unknown) => {
            const entity = this.fromObject(item);
            this.decrypt(entity);
            return entity;
        });

        if (entities.length) {
            this.cache.set(this.getKey(query), entities);

            return entities;
        }

        return [];
    }

    public async remove(entity: T): Promise<void> {
        await this.removeMany({ filter: { ids: [(entity as ADocument).getId()] } } as Q);
    }

    public async removeMany(query?: Q): Promise<void> {
        await this.client.send(`/document/${this.collection}`, HttpMethods.DELETE, query);
        this.clearCache();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected encrypt(entity: T): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected decrypt(entity: T): void {}

    private findInCache<O>(query?: Q): O | undefined {
        if (this.cache.has(this.getKey(query))) {
            return this.cache.get(this.getKey(query));
        }

        return undefined;
    }

    private getKey(query?: Q): string {
        return `document_query_${this.collection}_${this.md5(query)}`;
    }

    private md5(query?: Q): string {
        return crypto.createHash('md5').update(JSON.stringify(query ?? {})).digest('hex');
    }

    private decorateQuery(query: string, parameter: string, value: unknown): string {
        if (query) {
            if (value) {
                return `${query}&${parameter}=${JSON.stringify(value)}`;
            }
            return query;
        }
        return `?${parameter}=${JSON.stringify(value)}`;
    }

}
