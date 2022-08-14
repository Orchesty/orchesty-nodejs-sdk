import express from 'express';

export default abstract class ACommonRouter {
  protected constructor(protected _app: express.Application, protected _name: string) {
    this.configureRoutes();
  }

  public getName(): string {
    return this._name;
  }

  public abstract configureRoutes(): express.Application;
}
