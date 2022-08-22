import express from 'express';

export default abstract class ACommonRouter {

    protected constructor(protected app: express.Application, protected name: string) {
        this.configureRoutes();
    }

    public abstract configureRoutes(): express.Application;

    public getName(): string {
        return this.name;
    }

}
