import NodeCache from 'node-cache';
import { HttpMethods } from '../../Transport/HttpMethods';
import Client from '../../Worker-api/Client';
import ADocument, { ClassType } from './ADocument';

const STD_TTL = 1;

export interface ISorter {
    created: 'asc' | 'desc';
}

export interface IFilter {
    ids?: string[];
    deleted?: boolean;
}

export interface IPaging {
    limit?: number;
    offset?: number;
}

interface IRepository<T> {
    fromObject(object: unknown): T;
}

export default class Repository<
    T,
    F extends IFilter = IFilter,
    S extends ISorter = ISorter,
    P extends IPaging = IPaging >
implements IRepository<T> {

    public collection: string;

    private readonly cache: NodeCache;

    public constructor(
        collection: ClassType<T>,
        protected client: Client,
    ) {
        this.cache = new NodeCache({ stdTTL: STD_TTL, checkperiod: 1 });
        this.collection = collection.getCollection();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public fromObject(object: unknown): T {
        throw new Error('Method not implemented.');
    }

    public clearCache(): this {
        this.cache.flushAll();
        return this;
    }

    public async insert(entity: T): Promise<this> {
        await this.insertMany([entity]);
        return this;
    }

    public async insertMany(entities: T[]): Promise<this> {
        entities.forEach((entity) => this.beforeSend(entity));
        await this.client.send(`/document/${this.collection}`, HttpMethods.POST, entities);
        return this.clearCache();
    }

    public async update(entity: T): Promise<this> {
        await this.insertMany([entity]);
        return this;
    }

    public async findById(id: string): Promise<T | undefined> {
        return this.findOne({ ids: [id] } as F);
    }

    public async findOne(filter: F, sorter?: S, paging?: P): Promise<T | undefined> {
        return (await this.findMany(filter, sorter, paging))?.[0];
    }

    public async findManyById(ids: string[]): Promise<T[]> {
        return this.findMany({ ids } as F);
    }

    public async findMany(filter?: F, sorter?: S, paging?: P): Promise<T[]> {
        const path = this.createQuery(filter, sorter, paging);

        const cacheRecord = this.findInCache<T[]>(path);
        if (cacheRecord) {
            return cacheRecord;
        }

        const find = (await this.client.send(path, HttpMethods.GET)).data;

        if (!find) {
            return [];
        }

        const entities: T[] = find.map((item: unknown) => {
            const entity = this.fromObject(item);
            this.afterReceive(entity);
            return entity;
        });

        if (entities.length) {
            this.cache.set(path, entities);

            return entities;
        }

        return [];
    }

    public async remove(entity: T): Promise<this> {
        await this.removeMany({ ids: [(entity as ADocument).getId()] } as F);
        return this;
    }

    public async removeMany(filter?: F): Promise<this> {
        await this.client.send(`/document/${this.collection}`, HttpMethods.DELETE, filter);
        return this.clearCache();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected beforeSend(entity: T): this {
        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected afterReceive(entity: T): this {
        return this;
    }

    private findInCache<O>(path: string): O | undefined {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        return undefined;
    }

    private createQuery(filter?: F, sorter?: S, paging?: P): string {
        let queryParams = '';
        queryParams = this.decorateQuery(queryParams, 'filter', filter);
        queryParams = this.decorateQuery(queryParams, 'sorter', sorter);
        queryParams = this.decorateQuery(queryParams, 'paging', paging);

        return `/document/${this.collection}${queryParams}`;
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
