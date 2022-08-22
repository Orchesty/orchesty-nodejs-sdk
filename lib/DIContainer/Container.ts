/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassType } from 'mongodb-typescript/lib/repository';
import { APPLICATION_PREFIX } from '../Application/ApplicationRouter';
import { IApplication } from '../Application/Base/IApplication';
import { BATCH_PREFIX } from '../Batch/BatchRouter';
import { IBatchNode } from '../Batch/IBatchNode';
import { ICommonNode } from '../Commons/ICommonNode';
import { CONNECTOR_PREFIX } from '../Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../CustomNode/CustomNodeRouter';
import Repository from '../Storage/Mongodb/Repository';

const REPOSITORY = 'repository';

export default class DIContainer {

    private readonly services: Map<string, any>;

    public constructor() {
        this.services = new Map<string, any>();
    }

    public get<T = unknown>(name: string): T {
        if (this.has(name)) {
            return this.services.get(name);
        }

        throw new Error(`Service with name [${name}] does not exist!`);
    }

    public getAllByPrefix(prefix: string): any[] {
        const services: any[] = [];
        this.services.forEach((value, key) => {
            if (key.startsWith(prefix)) {
                services.push(value);
            }
        });

        return services;
    }

    public has(name: string): boolean {
        return this.services.has(name);
    }

    public set<T>(name: string, service: T): void {
        if (!this.has(name)) {
            this.services.set(name, service);
        } else {
            throw new Error(`Service with name [${name}] already exist!`);
        }
    }

    public setConnector(service: ICommonNode): void {
        this.set(`${CONNECTOR_PREFIX}.${service.getName()}`, service);
    }

    public getConnector(name: string): ICommonNode {
        return this.get(`${CONNECTOR_PREFIX}.${name}`);
    }

    public setCustomNode(service: ICommonNode): void {
        this.set(`${CUSTOM_NODE_PREFIX}.${service.getName()}`, service);
    }

    public getCustomNode(name: string): ICommonNode {
        return this.get(`${CUSTOM_NODE_PREFIX}.${name}`);
    }

    public setApplication(service: IApplication): void {
        this.set(`${APPLICATION_PREFIX}.${service.getName()}`, service);
    }

    public getApplication(name: string): IApplication {
        return this.get(`${APPLICATION_PREFIX}.${name}`);
    }

    public setBatch(service: IBatchNode): void {
        this.set(`${BATCH_PREFIX}.${service.getName()}`, service);
    }

    public getBatch(name: string): IBatchNode {
        return this.get(`${BATCH_PREFIX}.${name}`);
    }

    public setRepository<T extends object>(repository: Repository<T>): void {
        this.set(`${REPOSITORY}.${repository.getName()}`, repository);
    }

    public getRepository<T extends object>(type: ClassType<T>): Repository<T> {
        return this.get(`${REPOSITORY}.${type.name}`);
    }

}
