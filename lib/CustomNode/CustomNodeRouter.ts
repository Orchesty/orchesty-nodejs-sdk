import express, { Request, Response } from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';
import { ICommonNode } from '../Commons/ICommonNode';

export const CUSTOM_NODE_PREFIX = 'hbpf.connector';

export default class CustomNodeRouter extends ACommonRouter {
  constructor(app: express.Application, private _loader: CommonLoader) {
    super(app, 'CustomNodeRouter');
  }

  configureRoutes(): express.Application {
    this._app.route('/custom_node/:name/process').post(async (req, res, next) => {
      const customNode = this._loader.get(CUSTOM_NODE_PREFIX, req.params.name) as ICommonNode;
      const dto = await customNode.processAction(createProcessDto(req));

      createSuccessResponse(res, dto);
      next();
    });

    this._app.route('/custom_node/:name/process/test').get((req, res) => {
      this._loader.get(CUSTOM_NODE_PREFIX, req.params.name);
      res.json([]);
    });

    this._app.route('/custom_node/list').get((req: Request, res: Response) => {
      res.json(this._loader.getList(CUSTOM_NODE_PREFIX));
    });

    return this._app;
  }
}
