import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import BatchProcessDto from '../Utils/BatchProcessDto';
import { createApiErrorResponse, createBatchProcessDto, createSuccessResponse, releaseDtoOnClose } from '../Utils/Router';
import ABatchNode from './ABatchNode';

export const BATCH_PREFIX = 'hbpf.batch';

export default class BatchRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'BatchRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/batch/:name/action')
            .post(async (req, res, next) => {
                let acquiredBatchProcessDto: BatchProcessDto | undefined;

                try {
                    const batch = this.loader.get(BATCH_PREFIX, req.params.name) as ABatchNode;
                    acquiredBatchProcessDto = await createBatchProcessDto(req, batch.getApplicationName());
                    const dto = await batch.processAction(acquiredBatchProcessDto);

                    createSuccessResponse(res, dto, batch);
                    releaseDtoOnClose(res, dto);

                    if (dto !== acquiredBatchProcessDto) {
                        releaseDtoOnClose(res, acquiredBatchProcessDto);
                    }

                    acquiredBatchProcessDto = undefined;
                    next();
                } catch (e) {
                    if (acquiredBatchProcessDto) {
                        releaseDtoOnClose(res, acquiredBatchProcessDto);
                    }

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
