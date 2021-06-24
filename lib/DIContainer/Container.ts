/* eslint-disable @typescript-eslint/no-explicit-any */
import { CONNECTOR_PREFIX } from '../Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../CustomNode/CustomNodeRouter';
import { IApplication } from '../Application/Base/IApplication';
import { ICommonNode } from '../Commons/ICommonNode';
import { APPLICATION_PREFIX } from '../Application/ApplicationRouter';
import { BATCH_PREFIX } from '../Batch/BatchRouter';

interface IContainer {
  get(name: string): any;

  getAllByPrefix(prefix: string): any[];

  set(name: string, service: any): void;

  setConnector(name: string, service: any): void;

  setCustomNode(name: string, service: any): void;

  has(name: string): boolean;

  setApplication(name: string, service: IApplication): void;

  setBatch(name: string, service: any): void;
}

export default class DIContainer implements IContainer {
  private _services: Map<string, any>;

  constructor() {
    this._services = new Map<string, any>();
  }

  get(name: string): any {
    if (this.has(name)) {
      return this._services.get(name);
    }

    throw new Error(`Service with name "${name}" does not exist!`);
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
      throw new Error(`Service with name "${name}" already exist!`);
    }
  }

  setConnector(name: string, service: ICommonNode): void {
    this.set(`${CONNECTOR_PREFIX}.${name}`, service);
  }

  setCustomNode(name: string, service: ICommonNode): void {
    this.set(`${CUSTOM_NODE_PREFIX}.${name}`, service);
  }

  setApplication(name: string, service: IApplication): void {
    this.set(`${APPLICATION_PREFIX}.${name}`, service);
  }

  setBatch(name: string, service: ICommonNode): void {
    this.set(`${BATCH_PREFIX}.${name}`, service);
  }
}
