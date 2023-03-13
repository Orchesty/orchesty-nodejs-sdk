import { HttpMethods } from '../../Transport/HttpMethods';
import Client from '../../Worker-api/Client';
import ADocument, { ClassType } from './ADocument';
import DatabaseClient from './Client';

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
    P extends IPaging = IPaging>
implements IRepository<T> {

    public collection: string;

    private readonly client: Client;

    public constructor(
        collection: ClassType<T>,
        databaseClient: DatabaseClient,
    ) {
        this.collection = collection.getCollection();
        this.client = databaseClient.getClient();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public fromObject(object: unknown): T {
        throw new Error('Method not implemented.');
    }

    public async insert(entity: T): Promise<this> {
        await this.insertMany([entity]);
        return this;
    }

    public async insertMany(entities: T[]): Promise<this> {
        entities.forEach((entity) => this.beforeSend(entity));
        await this.client.send(`/document/${this.collection}`, HttpMethods.POST, entities);
        entities.forEach((entity) => this.afterReceive(entity));
        return this;
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

        const result = await this.client.send(path, HttpMethods.GET);

        if (result.status !== 200) {
            throw new Error(result?.data?.message ?? 'Unknown exception!');
        }

        const find = result.data;

        const entities: T[] = find.map((item: unknown) => {
            const entity = this.fromObject(item);
            this.afterReceive(entity);
            return entity;
        });

        return entities;
    }

    public async remove(entity: T): Promise<this> {
        await this.removeMany({ ids: [(entity as ADocument).getId()] } as F);
        return this;
    }

    public async removeMany(filter?: F): Promise<this> {
        await this.client.send(this.createQuery(filter), HttpMethods.DELETE);
        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected beforeSend(entity: T): this {
        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected afterReceive(entity: T): this {
        return this;
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
