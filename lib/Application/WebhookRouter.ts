import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import WebhookManager from './Manager/WebhookManager';

export class WebhookRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly manager: WebhookManager) {
        super(app, 'WebhookRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/webhook/applications/:name/users/:user/subscribe').post(async (req, res) => {
            await this.manager.subscribeWebhooks(req.params.name, req.params.user, JSON.parse(req.body));

            res.json([]);
        });

        this.app.route('/webhook/applications/:name/users/:user/unsubscribe').post(async (req, res) => {
            await this.manager.unsubscribeWebhooks(req.params.name, req.params.user, JSON.parse(req.body));

            res.json([]);
        });

        return this.app;
    }

}
