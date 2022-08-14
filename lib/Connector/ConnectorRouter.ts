import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';

export const CONNECTOR_PREFIX = 'hbpf.connector';

export default class ConnectorRouter extends ACommonRouter {
  public constructor(app: express.Application, private readonly _loader: CommonLoader) {
    super(app, 'ConnectorRouter');
  }

  public configureRoutes(): express.Application {
    this._app.route('/connector/:name/action').post(async (req, res, next) => {
      try {
        const connector = this._loader.get(CONNECTOR_PREFIX, req.params.name) as ICommonNode;
        const dto = await connector.processAction(await createProcessDto(req));

        createSuccessResponse(res, dto);
        res.on('finish', () => {
          dto.free = true;
        });
        next();
      } catch (e) {
        next(e);
      }
    });

    this._app.route('/connector/:name/action/test').get((req, res, next) => {
      this._loader.get(CONNECTOR_PREFIX, req.params.name);
      res.json([]);
      next();
    });

    this._app.route('/connector/list').get((req, res, next) => {
      res.json(this._loader.getList(CONNECTOR_PREFIX));
      next();
    });

    return this._app;
  }
}
