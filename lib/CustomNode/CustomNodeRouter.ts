import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import ANode from '../Commons/ANode';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';
import ProcessDto from '../Utils/ProcessDto';
import { createApiErrorResponse, createProcessDto, createSuccessResponse, releaseDtoOnClose } from '../Utils/Router';

export const CUSTOM_NODE_PREFIX = 'hbpf.custom-node';

export default class CustomNodeRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'CustomNodeRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/custom-node/:name/process').post(async (req, res, next) => {
            let acquiredProcessDto: ProcessDto | undefined;

            try {
                const customNode = this.loader.get(CUSTOM_NODE_PREFIX, req.params.name) as ICommonNode;
                acquiredProcessDto = await createProcessDto(req);
                const dto = await customNode.processAction(acquiredProcessDto);

                createSuccessResponse(res, dto, customNode instanceof ANode ? customNode : undefined);
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

        this.app.route('/custom-node/:name/process/test').get(async (req, res, next) => {
            try {
                // eslint-disable-next-line @typescript-eslint/await-thenable
                await this.loader.get(CUSTOM_NODE_PREFIX, req.params.name);
                res.json([]);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/custom-node/list').get((req, res, next) => {
            try {
                res.json(this.loader.getList(CUSTOM_NODE_PREFIX));
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        return this.app;
    }

}
