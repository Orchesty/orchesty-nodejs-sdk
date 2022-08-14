import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import { createBatchProcessDto, createSuccessResponse } from '../Utils/Router';
import CommonLoader from '../Commons/CommonLoader';
import { IBatchNode } from './IBatchNode';

export const BATCH_PREFIX = 'hbpf.batch';

export default class BatchRouter extends ACommonRouter {
  public constructor(app: express.Application, private readonly _loader: CommonLoader) {
    super(app, 'BatchRouter');
  }

  public configureRoutes(): express.Application {
    this._app.route('/batch/:name/action')
      .post(async (req, res, next) => {
        try {
          const batch = this._loader.get(BATCH_PREFIX, req.params.name) as IBatchNode;
          const dto = await batch.processAction(await createBatchProcessDto(req));

          createSuccessResponse(res, dto);
          res.on('finish', () => {
            dto.free = true;
          });
          next();
        } catch (e) {
          next(e);
        }
      });

    this._app.route('/batch/:name/action/test')
      .get((req, res) => {
        this._loader.get(BATCH_PREFIX, req.params.name);
        res.json([]);
      });

    this._app.route('/batch/list')
      .get((req, res) => {
        res.json(this._loader.getList(BATCH_PREFIX));
      });

    return this._app;
  }
}
