import express from 'express';
import { StatusCodes } from 'http-status-codes';
import ACommonRouter from '../Commons/ACommonRouter';
import ApplicationManager from './Manager/ApplicationManager';
import { OAuth2Provider } from '../Authorization/Provider/OAuth2/OAuth2Provider';

export const APPLICATION_PREFIX = 'hbpf.application';

export class ApplicationRouter extends ACommonRouter {
  constructor(app: express.Application, private _manager: ApplicationManager) {
    super(app, 'ApplicationRouter');
  }

  configureRoutes(): express.Application {
    this._app.route('/applications').get((req, res) => {
      res.json({ items: this._manager.getApplications() });
    });

    this._app.route('/applications/:name').get((req, res) => {
      res.json(this._manager.getApplication(req.params.name).toArray());
    });

    this._app.route('/applications/:name/sync/list').get((req, res) => {
      res.json(this._manager.getSynchronousActions(req.params.name));
    });

    this._app.route('/applications/:name/sync/:method')
      .get(async (req, res) => {
        res.json(await this._manager.runSynchronousAction(req.params.name, req.params.method, req));
      })
      .post(async (req, res) => {
        res.json(await this._manager.runSynchronousAction(req.params.name, req.params.method, req));
      });

    this._app.route('/applications/:name/users/:user/authorize').get(async (req, res) => {
      const redirectUrl = req.query.redirect_url;
      if (!redirectUrl) {
        throw Error('Missing "redirect_url" query parameter.');
      }

      const url = await this._manager.authorizationApplication(
        req.params.name,
        req.params.user,
        redirectUrl.toString(),
      );

      res.json({ authorizeUrl: url });
    });

    this._app.route('/applications/:name/users/:user/authorize/token').get(async (req, res) => {
      const url = await this._manager.saveAuthorizationToken(
        req.params.name,
        req.params.user,
        req.query as { [key: string]: string },
      );

      res.json({ redirectUrl: url });
    });

    this._app.route('/applications/authorize/token').get(async (req, res) => {
      const { state } = req.query;
      if (!state) {
        throw Error('Missing "state" query parameter.');
      }
      const stateDecode = OAuth2Provider.stateDecode(state.toString());
      const url = await this._manager.saveAuthorizationToken(
        stateDecode.name,
        stateDecode.user,
        req.query as { [key: string]: string },
      );

      res.json({ redirectUrl: url });
    });

    this._app.route('/applications/:name/users/:user/install').post(async (req, res) => {
      const { name, user } = req.params;
      const response = await this._manager.installApplication(name, user);
      res.status(StatusCodes.CREATED);
      res.json(response);
    });

    this._app.route('/applications/:name/users/:user/settings').put(async (req, res) => {
      const { name, user } = req.params;
      const response = await this._manager.saveApplicationSettings(name, user, JSON.parse(req.body));
      res.status(StatusCodes.OK);
      res.json(response);
    });

    this._app.route('/applications/:name/users/:user/password').put(async (req, res) => {
      const { name, user } = req.params;
      const { password } = JSON.parse(req.body);
      if (!password) {
        throw Error('Missing "password" query parameter.');
      }
      const response = await this._manager.saveApplicationPassword(name, user, password);
      res.status(StatusCodes.OK);
      res.json(response);
    });

    this._app.route('/applications/:name/users/:user/uninstall').delete(async (req, res) => {
      const { name, user } = req.params;
      await this._manager.uninstallApplication(name, user);
      res.status(StatusCodes.OK);
      res.json({});
    });

    this._app.route('/applications/:name/users/:user').get(async (req, res) => {
      const { name, user } = req.params;
      const response = await this._manager.detailApplication(name, user);
      res.status(StatusCodes.OK);
      res.json(response);
    });

    this._app.route('/applications/users/:user').get(async (req, res) => {
      const { user } = req.params;
      const response = await this._manager.userApplications(user);
      res.status(StatusCodes.OK);
      res.json(response);
    });

    return this._app;
  }
}
