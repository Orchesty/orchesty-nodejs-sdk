import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import { createBatchProcessDto, createSuccessResponse } from '../Utils/Router';
import { IBatchNode } from './IBatchNode';

export const BATCH_PREFIX = 'hbpf.batch';

export default class BatchRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'BatchRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/batch/:name/action')
            .post(async (req, res, next) => {
                try {
                    const batch = this.loader.get(BATCH_PREFIX, req.params.name) as IBatchNode;
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

        this.app.route('/batch/:name/action/test')
            .get((req, res) => {
                this.loader.get(BATCH_PREFIX, req.params.name);
                res.json([]);
            });

        this.app.route('/batch/list')
            .get((req, res) => {
                res.json(this.loader.getList(BATCH_PREFIX));
            });

        return this.app;
    }

}
