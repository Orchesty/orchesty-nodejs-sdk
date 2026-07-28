import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import ANode from '../Commons/ANode';
import CommonLoader from '../Commons/CommonLoader';
import ProcessDto from '../Utils/ProcessDto';
import { createApiErrorResponse, createProcessDto, createSuccessResponse, releaseDtoOnClose } from '../Utils/Router';

export const CONNECTOR_PREFIX = 'hbpf.connector';

export default class ConnectorRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'ConnectorRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/connector/:name/action').post(async (req, res, next) => {
            let acquiredProcessDto: ProcessDto | undefined;

            try {
                const connector = this.loader.get(CONNECTOR_PREFIX, req.params.name) as ANode;
                acquiredProcessDto = await createProcessDto(req, connector.getApplicationName());
                const dto = await connector.processAction(acquiredProcessDto);

                createSuccessResponse(res, dto, connector);
                releaseDtoOnClose(res, dto);

                if (dto !== acquiredProcessDto) {
                    releaseDtoOnClose(res, acquiredProcessDto);
                }

                acquiredProcessDto = undefined;
                next();
            } catch (e) {
                if (acquiredProcessDto) {
                    releaseDtoOnClose(res, acquiredProcessDto);
                }

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
