import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import { ICommonNode } from '../Commons/ICommonNode';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';
import CommonLoader from '../Commons/CommonLoader';

export const BATCH_PREFIX = 'hbpf.batch';

export default class BatchRouter extends ACommonRouter {
  private _loader: CommonLoader;

  constructor(app: express.Application, loader: CommonLoader) {
    super(app, 'BatchRouter');
    this._loader = loader;
  }

  configureRoutes(): express.Application {
    this._app.route('/batch/:name/action')
      .post(async (req, res, next) => {
        const batch = this._loader.get(BATCH_PREFIX, req.params.name) as ICommonNode;
        const dto = await batch.processAction(createProcessDto(req));

        createSuccessResponse(res, dto);
        res.on('finish', () => {
          dto.free = true;
        });
        next();
      });

    this._app.route('/batch/:name/action/test')
      .get(async (req, res) => {
        await this._loader.get(BATCH_PREFIX, req.params.name);
        res.json([]);
      });

    this._app.route('/batch/list')
      .get((req, res) => {
        res.json(this._loader.getList(BATCH_PREFIX));
      });

    return this._app;
  }
}
