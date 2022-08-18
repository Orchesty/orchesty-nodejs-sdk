import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';
import { createProcessDto, createSuccessResponse } from '../Utils/Router';

export const CONNECTOR_PREFIX = 'hbpf.connector';

export default class ConnectorRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'ConnectorRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/connector/:name/action').post(async (req, res, next) => {
            try {
                const connector = this.loader.get(CONNECTOR_PREFIX, req.params.name) as ICommonNode;
                const dto = await connector.processAction(await createProcessDto(req));

                createSuccessResponse(res, dto);
                res.on('finish', () => {
                    dto.setFree(true);
                });
                next();
            } catch (e) {
                next(e);
            }
        });

        this.app.route('/connector/:name/action/test').get((req, res, next) => {
            this.loader.get(CONNECTOR_PREFIX, req.params.name);
            res.json([]);
            next();
        });

        this.app.route('/connector/list').get((req, res, next) => {
            res.json(this.loader.getList(CONNECTOR_PREFIX));
            next();
        });

        return this.app;
    }

}
