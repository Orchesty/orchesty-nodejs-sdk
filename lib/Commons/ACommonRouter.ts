import express from 'express';

export default abstract class ACommonRouter {
  protected constructor(protected _app: express.Application, protected _name: string) {
    this.configureRoutes();
  }

  getName(): string {
    return this._name;
  }

    abstract configureRoutes(): express.Application;
}
