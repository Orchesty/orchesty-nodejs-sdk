/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClassType } from 'mongodb-typescript/lib/repository';
import { IBatchNode } from '../Batch/IBatchNode';
import { CONNECTOR_PREFIX } from '../Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../CustomNode/CustomNodeRouter';
import { IApplication } from '../Application/Base/IApplication';
import { ICommonNode } from '../Commons/ICommonNode';
import { APPLICATION_PREFIX } from '../Application/ApplicationRouter';
import { BATCH_PREFIX } from '../Batch/BatchRouter';
import Repository from '../Storage/Mongodb/Repository';

const REPOSITORY = 'repository';

export default class DIContainer {
  private _services: Map<string, any>;

  constructor() {
    this._services = new Map<string, any>();
  }

  get(name: string): any {
    if (this.has(name)) {
      return this._services.get(name);
    }

    throw new Error(`Service with name [${name}] does not exist!`);
  }

  getAllByPrefix(prefix: string): any[] {
    const services: any[] = [];
    this._services.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        services.push(value);
      }
    });

    return services;
  }

  has(name: string): boolean {
    return this._services.has(name);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  set(name: string, service: any): void {
    if (!this.has(name)) {
      this._services.set(name, service);
    } else {
      throw new Error(`Service with name [${name}] already exist!`);
    }
  }

  setConnector(service: ICommonNode): void {
    this.set(`${CONNECTOR_PREFIX}.${service.getName()}`, service);
  }

  getConnector(name: string): ICommonNode {
    return this.get(`${CONNECTOR_PREFIX}.${name}`);
  }

  setCustomNode(service: ICommonNode): void {
    this.set(`${CUSTOM_NODE_PREFIX}.${service.getName()}`, service);
  }

  getCustomNode(name: string): ICommonNode {
    return this.get(`${CUSTOM_NODE_PREFIX}.${name}`);
  }

  setApplication(service: IApplication): void {
    this.set(`${APPLICATION_PREFIX}.${service.getName()}`, service);
  }

  getApplication(name: string): IApplication {
    return this.get(`${APPLICATION_PREFIX}.${name}`);
  }

  setBatch(service: IBatchNode): void {
    this.set(`${BATCH_PREFIX}.${service.getName()}`, service);
  }

  getBatch(name: string): IBatchNode {
    return this.get(`${BATCH_PREFIX}.${name}`);
  }

  setRepository<T>(repository: Repository<T>): void {
    this.set(`${REPOSITORY}.${repository.name}`, repository);
  }

  getRepository<T>(type: ClassType<T>): Repository<T> {
    return this.get(`${REPOSITORY}.${type.name}`);
  }
}
