import express from 'express';
import CommonRouter from '../Commons/CommonRouter';
import { ICommonNode } from '../Commons/ICommonNode';
import { createProcessDTO, createSuccessResponse } from '../Utils/Router';
import CommonLoader from '../Commons/CommonLoader';

export const BATCH_PREFIX = 'hbpf.batch';

export default class BatchRouter extends CommonRouter {
  private _loader: CommonLoader;

  constructor(app: express.Application, loader: CommonLoader) {
    super(app, 'BatchRouter');
    this._loader = loader;
  }

  configureRoutes(): express.Application {
    this.app.route('/batch/:name/action').post(async (req, res, next) => {
      const batch = this._loader.get(BATCH_PREFIX, req.params.name) as ICommonNode;
      const dto = await batch.processAction(createProcessDTO(req));

      createSuccessResponse(res, dto);
      next();
    });

    this.app.route('/batch/:name/action/test').get((req, res) => {
      this._loader.get(BATCH_PREFIX, req.params.name);
      res.json([]);
    });

    this.app.route('/batch/list').get((req, res) => {
      res.json(this._loader.getList(BATCH_PREFIX));
    });

    return this.app;
  }
}
