import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { OAuth2Provider } from '../Authorization/Provider/OAuth2/OAuth2Provider';
import ACommonRouter from '../Commons/ACommonRouter';
import { createApiErrorResponse } from '../Utils/Router';
import ApplicationManager from './Manager/ApplicationManager';

export const APPLICATION_PREFIX = 'hbpf.application';

export class ApplicationRouter extends ACommonRouter {

    public constructor(app: express.Application, private readonly manager: ApplicationManager) {
        super(app, 'ApplicationRouter');
    }

    public configureRoutes(): express.Application {
        this.app.route('/applications').get((req, res, next) => {
            try {
                res.json({ items: this.manager.getApplications() });
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name').get((req, res, next) => {
            try {
                res.json(this.manager.getApplication(req.params.name).toArray());
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/sync/list').get((req, res, next) => {
            try {
                res.json(this.manager.getSynchronousActions(req.params.name));
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/sync/:method')
            .all(async (req, res, next) => {
                try {
                    res.json(await this.manager.runSynchronousAction(req.params.name, req.params.method, req));
                    next();
                } catch (e) {
                    createApiErrorResponse(req, res, e);
                }
            });

        this.app.route('/applications/:name/users/:user/authorize').get(async (req, res, next) => {
            try {
                const redirectUrl = req.query.redirect_url;
                if (!redirectUrl) {
                    throw Error('Missing "redirect_url" query parameter.');
                }

                const url = await this.manager.authorizationApplication(
                    req.params.name,
                    req.params.user,
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    redirectUrl.toString(),
                );

                res.json({ authorizeUrl: url });
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/users/:user/authorize/token').get(async (req, res, next) => {
            try {
                const url = await this.manager.saveAuthorizationToken(
                    req.params.name,
                    req.params.user,
                    req.query as Record<string, string>,
                );

                res.json({ redirectUrl: url });
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/authorize/token').get(async (req, res, next) => {
            try {
                const { state } = req.query;
                if (!state) {
                    throw Error('Missing "state" query parameter.');
                }
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                const stateDecode = OAuth2Provider.stateDecode(state.toString());
                const url = await this.manager.saveAuthorizationToken(
                    stateDecode.name,
                    stateDecode.user,
                    req.query as Record<string, string>,
                );

                res.json({ redirectUrl: url });
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/users/:user/install').post(async (req, res, next) => {
            try {
                const { name, user } = req.params;
                const response = await this.manager.installApplication(name, user);
                res.status(StatusCodes.CREATED);
                res.json(response);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/users/:user/settings').put(async (req, res, next) => {
            try {
                const { name, user } = req.params;
                const response = await this.manager.saveApplicationSettings(name, user, JSON.parse(req.body));
                res.status(StatusCodes.OK);
                res.json(response);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/users/:user/password').put(async (req, res, next) => {
            try {
                const { name, user } = req.params;
                const { password, formKey, fieldKey } = JSON.parse(req.body);
                if (!password || !formKey || !fieldKey) {
                    throw Error('Missing required parameters [password, formKey, fieldKey] in body.');
                }
                const response = await this.manager.saveApplicationPassword(name, user, formKey, fieldKey, password);
                res.status(StatusCodes.OK);
                res.json(response);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/users/:user/uninstall').delete(async (req, res, next) => {
            try {
                const { name, user } = req.params;
                await this.manager.uninstallApplication(name, user);
                res.status(StatusCodes.OK);
                res.json({});
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/:name/users/:user').get(async (req, res, next) => {
            try {
                const { name, user } = req.params;
                const response = await this.manager.detailApplication(name, user);
                res.status(StatusCodes.OK);
                res.json(response);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        this.app.route('/applications/users/:user').get(async (req, res, next) => {
            try {
                const { user } = req.params;
                const response = await this.manager.userApplications(user);
                res.status(StatusCodes.OK);
                res.json(response);
                next();
            } catch (e) {
                createApiErrorResponse(req, res, e);
            }
        });

        return this.app;
    }

}
