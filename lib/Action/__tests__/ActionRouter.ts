import express from 'express';
import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import bodyParser from '../../Middleware/BodyParseHandler';
import ActionControlPlaneClient from '../ActionControlPlaneClient';
import ActionRouter from '../ActionRouter';
import ActionRunner from '../ActionRunner';
import { ActionError, IActionCatalogItem } from '../types';

const catalog: IActionCatalogItem[] = [{
    name: 'echo',
    app: 'demo',
    kind: 'read',
    idempotent: false,
    description: 'Echo',
    inputSchema: {},
    timeout: 5,
}];

describe('ActionRouter', () => {
    let app: express.Application;
    let runner: ActionRunner;
    let router: ActionRouter;

    beforeEach(() => {
        app = express();
        app.use(bodyParser);
        runner = new ActionRunner(new ActionControlPlaneClient('http://backend', 'key'));
        router = new ActionRouter(app, runner);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('has its name', () => {
        expect(router.getName()).toBe('ActionRouter');
    });

    it('get /action/list route', async () => {
        jest.spyOn(runner, 'list').mockReturnValue(catalog);

        await supertest(app)
            .get('/action/list')
            .expect(StatusCodes.OK, catalog);
    });

    it('post /action/:key/run route passes the body to the runner', async () => {
        const run = jest.spyOn(runner, 'run').mockResolvedValue({ ok: true });

        await supertest(app)
            .post('/action/demo.echo/run')
            .send(JSON.stringify({
                input: { id: 1 },
                identity: 'u@x.io',
                sdk: 'node-sdk',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                idempotency_key: 'k1',
                correlation_id: 'c1',
            }))
            .expect(StatusCodes.OK, { result: { ok: true } });

        expect(run).toHaveBeenCalledWith(
            'demo.echo',
            { id: 1 },
            { identity: 'u@x.io', sdk: 'node-sdk', idempotencyKey: 'k1', correlationId: 'c1' },
        );
    });

    it('post /action/:key/run route ignores fields of the wrong type', async () => {
        const run = jest.spyOn(runner, 'run').mockResolvedValue(null);

        await supertest(app)
            .post('/action/demo.echo/run')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .send(JSON.stringify({ input: [1], identity: 'u@x.io', sdk: 'node-sdk', idempotency_key: 1 }))
            .expect(StatusCodes.OK, { result: null });

        expect(run).toHaveBeenCalledWith(
            'demo.echo',
            {},
            { identity: 'u@x.io', sdk: 'node-sdk', idempotencyKey: undefined, correlationId: undefined },
        );
    });

    it('post /action/:key/run route answers with the status of an action error', async () => {
        jest.spyOn(runner, 'run').mockRejectedValue(new ActionError('Not allowed.', StatusCodes.FORBIDDEN));

        await supertest(app)
            .post('/action/demo.echo/run')
            .send('{}')
            .expect(StatusCodes.FORBIDDEN, { error: 'Not allowed.' });
    });

    it('post /action/:key/run route answers 500 for any other error', async () => {
        jest.spyOn(runner, 'run').mockRejectedValue(new Error('boom'));

        await supertest(app)
            .post('/action/demo.echo/run')
            .send('{}')
            .expect(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'boom' });
    });
});
