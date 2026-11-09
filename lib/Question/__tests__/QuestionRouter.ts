import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { createDocumentMockedServer } from '../../../test/MockServer';
import TestQuestion from '../../../test/Question/TestQuestion';
import { expressApp, getTestContainer, mockRouter } from '../../../test/TestAbstact';
import DIContainer from '../../DIContainer/Container';
import errorHandler from '../../Middleware/ErrorHandler';
import Node from '../../Storage/Database/Document/Node';
import { QUESTION_SCHEMA, QUESTION_SKIP, QUESTION_TEXT } from '../../Utils/Headers';
import QuestionRouter from '../QuestionRouter';

describe('Test QuestionRouter', () => {
    let container: DIContainer;

    beforeAll(() => {
        container = getTestContainer();
        expressApp.use(errorHandler(container.getRepository(Node)));
    });

    beforeEach(() => {
        createDocumentMockedServer();
    });

    it('test configureRoutes', () => {
        const mock = mockRouter();
        const router = new QuestionRouter(mock.express, mock.loader);

        expect(mock.routeFn).toHaveBeenCalledTimes(3);
        expect(mock.getFn).toHaveBeenCalledTimes(2);
        expect(mock.postFn).toHaveBeenCalledTimes(1);
        expect(router.getName()).toEqual('QuestionRouter');
    });

    it('container registers question by instanceof', () => {
        expect(container.getQuestion('test-question')).toBeInstanceOf(TestQuestion);
    });

    it('get /question/list route', async () => {
        await supertest(expressApp)
            .get('/question/list')
            .expect(StatusCodes.OK, JSON.stringify([
                {
                    name: 'test-question',
                    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
                },
            ]));
    });

    it('get /question/:name/process/test route', async () => {
        await supertest(expressApp)
            .get('/question/test-question/process/test')
            .expect(StatusCodes.OK, '[]');
    });

    it('post /question/:name/process route - asks', async () => {
        const res = await supertest(expressApp)
            .post('/question/test-question/process')
            .send(JSON.stringify({ headers: {}, body: JSON.stringify({ greeting: 'Hi' }) }));

        expect(res.status).toBe(200);
        expect(res.body.headers[QUESTION_TEXT]).toBe('Hi, what is your name?');
        expect(JSON.parse(res.body.headers[QUESTION_SCHEMA])).toEqual(new TestQuestion().getSchema());
        expect(res.body.headers[QUESTION_SKIP]).toBeUndefined();
        expect(JSON.parse(res.body.body)).toEqual({ greeting: 'Hi' });
    });

    it('post /question/:name/process route - skips', async () => {
        const res = await supertest(expressApp)
            .post('/question/test-question/process')
            .send(JSON.stringify({ headers: {}, body: JSON.stringify({ name: 'Jan' }) }));

        expect(res.status).toBe(200);
        expect(res.body.headers[QUESTION_SKIP]).toBe('1');
        expect(res.body.headers[QUESTION_TEXT]).toBeUndefined();
        expect(res.body.headers[QUESTION_SCHEMA]).toBeUndefined();
    });
});
