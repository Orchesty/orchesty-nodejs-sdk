import express from 'express';
import CommonRouter from '../Commons/CommonRouter';
import { createProcessDTO, createSuccessResponse } from '../Utils/Router';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';

export const CONNECTOR_PREFIX = 'hbpf.connector';

export default class ConnectorRouter extends CommonRouter {
    private _loader: CommonLoader;

    constructor(app: express.Application, loader: CommonLoader) {
      super(app, 'ConnectorRouter');
      this._loader = loader;
    }

    configureRoutes(): express.Application {
      this.app.route('/connector/:name/action').post(async (req, res, next) => {
        const connector = this._loader.get(CONNECTOR_PREFIX, req.params.name) as ICommonNode;
        const dto = await connector.processAction(createProcessDTO(req));

        createSuccessResponse(res, dto);
        next();
      });

      this.app.route('/connector/:name/action/test').get((req, res) => {
        this._loader.get(CONNECTOR_PREFIX, req.params.name);
        res.json([]);
      });

      this.app.route('/connector/list').get((req, res) => {
        res.json(this._loader.getList(CONNECTOR_PREFIX));
      });

      // TODO: Deprecated
      this.app.route('/connector/:name/webhook').post(async (req, res, next) => {
        const connector = this._loader.get(CONNECTOR_PREFIX, req.params.name) as ICommonNode;
        const dto = await connector.processAction(createProcessDTO(req));

        createSuccessResponse(res, dto);
        next();
      });

      // TODO: Deprecated
      this.app.route('/connector/:name/webhook/test').get((req, res) => {
        this._loader.get(CONNECTOR_PREFIX, req.params.name);
        res.json([]);
      });

      return this.app;
    }
}
