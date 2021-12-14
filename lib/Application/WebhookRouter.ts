import express from 'express';
import ACommonRouter from '../Commons/ACommonRouter';
import WebhookManager from './Manager/WebhookManager';

// eslint-disable-next-line import/prefer-default-export
export class WebhookRouter extends ACommonRouter {
  constructor(app: express.Application, private _manager: WebhookManager) {
    super(app, 'WebhookRouter');
  }

  configureRoutes(): express.Application {
    this._app.route('/webhook/applications/:name/users/:user/subscribe').post(async (req, res) => {
      await this._manager.subscribeWebhooks(req.params.name, req.params.user, JSON.parse(req.body));

      res.json([]);
    });

    this._app.route('/webhook/applications/:name/users/:user/unsubscribe').post(async (req, res) => {
      await this._manager.unsubscribeWebhooks(req.params.name, req.params.user, JSON.parse(req.body));

      res.json([]);
    });

    return this._app;
  }
}
