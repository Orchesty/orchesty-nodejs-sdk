import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import ActionRunner from './ActionRunner';
import { ActionError } from './types';

function toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseBody(body: unknown): Record<string, unknown> {
    if (typeof body === 'string') {
        try {
            return toRecord(JSON.parse(body || '{}'));
        } catch {
            throw new ActionError('Body must be JSON.', 400);
        }
    }

    return toRecord(body);
}

export default class ActionRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly runner: ActionRunner) {
        super(app, 'ActionRouter');
    }

    public configureRoutes(): express.Application {
        this.app.get('/action/list', (_req, res) => {
            res.json(this.runner.list());
        });

        this.app.post('/action/:key/run', async (req, res) => {
            try {
                const body = parseBody(req.body);
                const result = await this.runner.run(req.params.key, toRecord(body.input), {
                    identity: String(body.identity ?? ''),
                    sdk: String(body.sdk ?? ''),
                    idempotencyKey: typeof body.idempotency_key === 'string' ? body.idempotency_key : undefined,
                    correlationId: typeof body.correlation_id === 'string' ? body.correlation_id : undefined,
                });
                res.json({ result });
            } catch (e) {
                const status = e instanceof ActionError ? e.status : 500;
                res.status(status).json({ error: (e as Error).message });
            }
        });

        return this.app;
    }

}
