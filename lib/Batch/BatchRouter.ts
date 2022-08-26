import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import { createApiErrorResponse, createBatchProcessDto, createSuccessResponse } from '../Utils/Router';
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
                        dto.setFree(true);
                    });
                    next();
                } catch (e) {
                    next(e);
                }
            });

        this.app.route('/batch/:name/action/test')
            .get(async (req, res, next) => {
                try {
                // eslint-disable-next-line @typescript-eslint/await-thenable
                    await this.loader.get(BATCH_PREFIX, req.params.name);
                    res.json([]);
                    next();
                } catch (e) {
                    createApiErrorResponse(req, res, e);
                }
            });

        this.app.route('/batch/list')
            .get((req, res, next) => {
                try {
                    res.json(this.loader.getList(BATCH_PREFIX));
                    next();
                } catch (e) {
                    createApiErrorResponse(req, res, e);
                }
            });

        return this.app;
    }

}
