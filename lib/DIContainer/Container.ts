/* eslint-disable @typescript-eslint/no-explicit-any */
import { APPLICATION_PREFIX } from '../Application/ApplicationRouter';
import { IApplication } from '../Application/Base/IApplication';
import ABatchNode from '../Batch/ABatchNode';
import { BATCH_PREFIX } from '../Batch/BatchRouter';
import { IBatchNode } from '../Batch/IBatchNode';
import ACommonNode from '../Commons/ACommonNode';
import ANode from '../Commons/ANode';
import { ICommonNode } from '../Commons/ICommonNode';
import { INode } from '../Commons/INode';
import AConnector from '../Connector/AConnector';
import { CONNECTOR_PREFIX } from '../Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../CustomNode/CustomNodeRouter';
import ADocument, { ClassType } from '../Storage/Database/ADocument';
import DatabaseClient from '../Storage/Database/Client';
import Repository, { IFilter, IPaging, ISorter } from '../Storage/Database/Repository';
import CurlSender from '../Transport/Curl/CurlSender';

const REPOSITORY = 'repository';

export default class DIContainer {

    private readonly services: Map<string, any>;

    public constructor() {
        this.services = new Map<string, any>();
    }

    public getNamed<T = unknown>(name: string): T {
        if (this.hasNamed(name)) {
            return this.services.get(name);
        }

        throw new Error(`Service with name [${name}] does not exist!`);
    }

    public get<T>(classLike: new (...args: any[]) => T): T {
        return this.getNamed(classLike.name);
    }

    public getAllByPrefix(prefix: string): { key: string; value: any }[] {
        const services: any[] = [];
        this.services.forEach((value, key) => {
            if (key.startsWith(prefix)) {
                services.push({
                    key: key.substring(prefix.length + 1),
                    value,
                });
            }
        });

        return services;
    }

    public has<T>(classLike: new (...args: any[]) => T): boolean {
        return this.services.has(classLike.name);
    }

    public hasNamed(name: string): boolean {
        return this.services.has(name);
    }

    public setNamed<T>(name: string, service: T): T {
        if (!this.hasNamed(name)) {
            this.services.set(name, service);
        } else {
            throw new Error(`Service with name [${name}] already exist!`);
        }

        return service;
    }

    public set<T extends object>(service: T): T {
        this.setNamed(service.constructor.name, service);

        return service;
    }

    public setNode<T extends INode>(node: T, application: IApplication | null = null): INode {
        if (node instanceof ANode) {
            node.setDb(this.get(DatabaseClient));
            if (application) {
                node.setApplication(application);
            }
        }

        if (node instanceof ABatchNode) {
            node.setSender(this.get(CurlSender));
            this.setBatch(node);
        } else if (node instanceof AConnector) {
            node.setSender(this.get(CurlSender));
            this.setConnector(node);
        } else if (node instanceof ACommonNode) {
            this.setCustomNode(node);
        }

        return node;
    }

    public setConnector(service: ICommonNode): ICommonNode {
        this.setNamed(`${CONNECTOR_PREFIX}.${service.getName()}`, service);

        return service;
    }

    public getConnector<T extends ICommonNode>(name: string): T {
        return this.getNamed(`${CONNECTOR_PREFIX}.${name}`);
    }

    public setCustomNode(service: ICommonNode): ICommonNode {
        this.setNamed(`${CUSTOM_NODE_PREFIX}.${service.getName()}`, service);

        return service;
    }

    public getCustomNode<T extends ICommonNode>(name: string): T {
        return this.getNamed(`${CUSTOM_NODE_PREFIX}.${name}`);
    }

    public setApplication(service: IApplication): IApplication {
        this.setNamed(`${APPLICATION_PREFIX}.${service.getName()}`, service);

        return service;
    }

    public getApplication(name: string): IApplication {
        return this.getNamed(`${APPLICATION_PREFIX}.${name}`);
    }

    public setBatch(service: IBatchNode): IBatchNode {
        this.setNamed(`${BATCH_PREFIX}.${service.getName()}`, service);

        return service;
    }

    public getBatch<T extends IBatchNode>(name: string): T {
        return this.getNamed(`${BATCH_PREFIX}.${name}`);
    }

    public setRepository
    <T extends ADocument, F extends IFilter, S extends ISorter, P extends IPaging>(repository: Repository<T, F, S, P>):
    void {
        this.setNamed(`${REPOSITORY}.${repository.collection}`, repository);
    }

    public getRepository
    <T extends ADocument, F extends IFilter, S extends ISorter, P extends IPaging>(collection: ClassType<T>):
    Repository<T, F, S, P> {
        return this.getNamed(`${REPOSITORY}.${collection.getCollection()}`);
    }

}
