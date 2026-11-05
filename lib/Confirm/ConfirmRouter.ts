import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import ANode from '../Commons/ANode';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';
import ProcessDto from '../Utils/ProcessDto';
import { createApiErrorResponse, createProcessDto, createSuccessResponse, releaseDtoOnClose } from '../Utils/Router';

export const CONFIRM_PREFIX = 'hbpf.confirm';

export default class ConfirmRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'ConfirmRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/confirm/:name/process').post(async (req, res, next) => {
            let acquiredProcessDto: ProcessDto | undefined;

            try {
                const confirm = this.loader.get(CONFIRM_PREFIX, req.params.name) as ICommonNode;
                const node = confirm instanceof ANode ? confirm : undefined;
                res.locals.node = node;
                acquiredProcessDto = await createProcessDto(req);
                const dto = await confirm.processAction(acquiredProcessDto);

                createSuccessResponse(res, dto, node);
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

        this.app.route('/confirm/:name/process/test').get(async (req, res, next) => {
            try {
                // eslint-disable-next-line @typescript-eslint/await-thenable
                await this.loader.get(CONFIRM_PREFIX, req.params.name);
                res.json([]);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/confirm/list').get((req, res, next) => {
            try {
                res.json(this.loader.getList(CONFIRM_PREFIX));
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        return this.app;
    }

}
