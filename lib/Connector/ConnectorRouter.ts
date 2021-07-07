import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';

export const CONNECTOR_PREFIX = 'hbpf.connector';

export default class ConnectorRouter extends ACommonRouter {
    private _loader: CommonLoader;

    constructor(app: express.Application, loader: CommonLoader) {
      super(app, 'ConnectorRouter');
      this._loader = loader;
    }

    configureRoutes(): express.Application {
      this._app.route('/connector/:name/action').post(async (req, res, next) => {
        const connector = this._loader.get(CONNECTOR_PREFIX, req.params.name) as ICommonNode;
        const dto = await connector.processAction(createProcessDto(req));

        createSuccessResponse(res, dto);
        next();
      });

      this._app.route('/connector/:name/action/test').get((req, res) => {
        this._loader.get(CONNECTOR_PREFIX, req.params.name);
        res.json([]);
      });

      this._app.route('/connector/list').get((req, res) => {
        res.json(this._loader.getList(CONNECTOR_PREFIX));
      });

      // TODO: Deprecated
      this._app.route('/connector/:name/webhook').post(async (req, res, next) => {
        const connector = this._loader.get(CONNECTOR_PREFIX, req.params.name) as ICommonNode;
        const dto = await connector.processAction(createProcessDto(req));

        createSuccessResponse(res, dto);
        next();
      });

      // TODO: Deprecated
      this._app.route('/connector/:name/webhook/test').get((req, res) => {
        this._loader.get(CONNECTOR_PREFIX, req.params.name);
        res.json([]);
      });

      return this._app;
    }
}
