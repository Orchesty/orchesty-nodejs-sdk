import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';

export const CUSTOM_NODE_PREFIX = 'hbpf.custom-node';

export default class CustomNodeRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'CustomNodeRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/custom-node/:name/process').post(async (req, res, next) => {
            try {
                const customNode = this.loader.get(CUSTOM_NODE_PREFIX, req.params.name) as ICommonNode;
                const dto = await customNode.processAction(await createProcessDto(req));

                createSuccessResponse(res, dto);
                res.on('finish', () => {
                    dto.setFree(true);
                });
                next();
            } catch (e) {
                next(e);
            }
        });

        this.app.route('/custom-node/:name/process/test').get((req, res, next) => {
            this.loader.get(CUSTOM_NODE_PREFIX, req.params.name);
            res.json([]);
            next();
        });

        this.app.route('/custom-node/list').get((req, res, next) => {
            res.json(this.loader.getList(CUSTOM_NODE_PREFIX));
            next();
        });

        return this.app;
    }

}
