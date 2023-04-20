import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import ANode from '../Commons/ANode';
import CommonLoader from '../Commons/CommonLoader';
import { createApiErrorResponse, createProcessDto, createSuccessResponse } from '../Utils/Router';

export const CONNECTOR_PREFIX = 'hbpf.connector';

export default class ConnectorRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'ConnectorRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/connector/:name/action').post(async (req, res, next) => {
            try {
                const connector = this.loader.get(CONNECTOR_PREFIX, req.params.name) as ANode;
                const dto = await connector.processAction(
                    await createProcessDto(req, connector.getApplicationName()),
                );

                createSuccessResponse(res, dto);
                res.on('finish', () => {
                    dto.setFree(true);
                });
                next();
            } catch (e) {
                next(e);
            }
        });

        this.app.route('/connector/:name/action/test').get(async (req, res, next) => {
            try {
                // eslint-disable-next-line @typescript-eslint/await-thenable
                await this.loader.get(CONNECTOR_PREFIX, req.params.name);
                res.json([]);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/connector/list').get((req, res, next) => {
            try {
                res.json(this.loader.getList(CONNECTOR_PREFIX));
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        return this.app;
    }

}
