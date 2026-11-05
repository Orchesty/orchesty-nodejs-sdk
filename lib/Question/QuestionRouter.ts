import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import ANode from '../Commons/ANode';
import CommonLoader from '../Commons/CommonLoader';
import { ICommonNode } from '../Commons/ICommonNode';
import ProcessDto from '../Utils/ProcessDto';
import { createApiErrorResponse, createProcessDto, createSuccessResponse, releaseDtoOnClose } from '../Utils/Router';

export const QUESTION_PREFIX = 'hbpf.question';

export default class QuestionRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly loader: CommonLoader) {
        super(app, 'QuestionRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/question/:name/process').post(async (req, res, next) => {
            let acquiredProcessDto: ProcessDto | undefined;

            try {
                const question = this.loader.get(QUESTION_PREFIX, req.params.name) as ICommonNode;
                const node = question instanceof ANode ? question : undefined;
                res.locals.node = node;
                acquiredProcessDto = await createProcessDto(req);
                const dto = await question.processAction(acquiredProcessDto);

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

        this.app.route('/question/:name/process/test').get(async (req, res, next) => {
            try {
                // eslint-disable-next-line @typescript-eslint/await-thenable
                await this.loader.get(QUESTION_PREFIX, req.params.name);
                res.json([]);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/question/list').get((req, res, next) => {
            try {
                res.json(this.loader.getList(QUESTION_PREFIX));
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        return this.app;
    }

}
