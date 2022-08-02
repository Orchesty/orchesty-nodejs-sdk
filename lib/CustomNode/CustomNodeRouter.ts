import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';
import { ICommonNode } from '../Commons/ICommonNode';

export const CUSTOM_NODE_PREFIX = 'hbpf.custom-node';

export default class CustomNodeRouter extends ACommonRouter {
  constructor(app: express.Application, private _loader: CommonLoader) {
    super(app, 'CustomNodeRouter');
  }

  configureRoutes(): express.Application {
    this._app.route('/custom-node/:name/process').post(async (req, res, next) => {
      try {
        const customNode = this._loader.get(CUSTOM_NODE_PREFIX, req.params.name) as ICommonNode;
        const dto = await customNode.processAction(await createProcessDto(req));

        createSuccessResponse(res, dto);
        res.on('finish', () => {
          dto.free = true;
        });
        next();
      } catch (e) {
        next(e);
      }
    });

    this._app.route('/custom-node/:name/process/test').get(async (req, res, next) => {
      await this._loader.get(CUSTOM_NODE_PREFIX, req.params.name);
      res.json([]);
      next();
    });

    this._app.route('/custom-node/list').get(async (req, res, next) => {
      res.json(await this._loader.getList(CUSTOM_NODE_PREFIX));
      next();
    });

    return this._app;
  }
}
