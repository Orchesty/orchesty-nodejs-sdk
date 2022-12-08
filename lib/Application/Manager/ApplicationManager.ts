import { Request } from 'express';
import { IOAuth2Application } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import { HttpMethods } from '../../Transport/HttpMethods';
import Annotation from '../../Utils/Annotation';
import { getLimiterKey, getLimiterKeyWithGroup } from '../../Utils/Headers';
import ApplicationLoader from '../ApplicationLoader';
import { APPLICATION_PREFIX } from '../ApplicationRouter';
import AApplication, { GROUP_TIME, GROUP_VALUE, IApplicationArray, TIME, USE_LIMIT, VALUE } from '../Base/AApplication';
import { isWebhook } from '../Base/ApplicationTypeEnum';
import CoreFormsEnum from '../Base/CoreFormsEnum';
import { IApplication } from '../Base/IApplication';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import ApplicationInstallRepository from '../Database/ApplicationInstallRepository';
import { IField } from '../Model/Form/Field';
import WebhookManager from './WebhookManager';

const AUTHORIZED = 'authorized';
const APPLICATION_SETTINGS = 'applicationSettings';

export default class ApplicationManager {

    public constructor(
        private readonly loader: ApplicationLoader,
        private readonly repository: ApplicationInstallRepository,
        private readonly webhookManager: WebhookManager,
    ) {
    }

    public getApplications(): IApplicationArray[] {
        return this.loader.getListApplications();
    }

    public getApplication(key: string): IApplication {
        return ((this.loader.get(APPLICATION_PREFIX, key)) as unknown) as IApplication;
    }

    public getSynchronousActions(key: string): string[] {
        const instanceOfClass = this.getApplication(key);
        return Annotation.getAllMethods(instanceOfClass);
    }

    public async runSynchronousAction(key: string, method: string, request: Request): Promise<unknown> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const app = this.getApplication(key) as any;
        const syncMethod = `sync${method[0].toUpperCase()}${method.substring(1)}`;
        if (typeof app[syncMethod] === 'function') {
            let resp;
            if (request.method === HttpMethods.GET) {
                resp = await app[syncMethod](); // eslint-disable-line @typescript-eslint/no-unsafe-call
            } else {
                resp = await app[syncMethod](request); // eslint-disable-line @typescript-eslint/no-unsafe-call
            }

            return resp ?? { status: 'ok' };
        }
        throw new Error(`Method [${syncMethod}] has not been found in application [${key}].`);
    }

    public async saveApplicationSettings(
        name: string,
        user: string,
        data: IApplicationSettings,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): Promise<Record<string, IField[] | unknown>> {
        const app = this.getApplication(name) as AApplication;
        const appInstall = await this.loadApplicationInstall(name, user);

        const res = (await app.saveApplicationForms(appInstall, data)).toArray();
        await this.repository.update(appInstall);

        return {
            ...res,
            [APPLICATION_SETTINGS]: await app.getApplicationForms(appInstall),
        };
    }

    public async saveApplicationPassword(
        name: string,
        user: string,
        formKey: string,
        fieldKey: string,
        password: string,
    ): Promise<Record<string, unknown>> {
        const app = this.getApplication(name);
        const appInstall = await this.loadApplicationInstall(name, user);

        const res = app.savePassword(appInstall, formKey, fieldKey, password).toArray();
        await this.repository.update(appInstall);

        return {
            ...res,
            [APPLICATION_SETTINGS]: await (app as unknown as AApplication).getApplicationForms(appInstall),
        };
    }

    public async authorizationApplication(name: string, user: string, redirectUrl: string): Promise<string> {
        const app = this.getApplication(name) as IOAuth2Application;
        const appInstall = await this.loadApplicationInstall(name, user);

        app.setFrontendRedirectUrl(appInstall, redirectUrl);
        await this.repository.update(appInstall);

        return app.authorize(appInstall);
    }

    public async saveAuthorizationToken(
        name: string,
        user: string,
        requestParams: Record<string, string>,
    ): Promise<string> {
        const app = this.getApplication(name) as IOAuth2Application;
        const appInstall = await this.loadApplicationInstall(name, user);
        await app.setAuthorizationToken(appInstall, requestParams);
        await this.repository.update(appInstall);
        return app.getFrontendRedirectUrl(appInstall);
    }

    public async installApplication(
        name: string,
        user: string,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): Promise<Record<string, IField[] | boolean | unknown>> {
        let appInstall = await this.repository.findByNameAndUser(name, user);
        if (appInstall) {
            throw Error(`ApplicationInstall with user [${user}] and name [${name}] already exists !`);
        }
        appInstall = new ApplicationInstall()
            .setUser(user)
            .setName(name);
        await this.repository.insert(appInstall);
        const app = this.getApplication(appInstall.getName()) as AApplication;
        return {
            ...app.toArray(),
            [AUTHORIZED]: app.isAuthorized(appInstall),
            [APPLICATION_SETTINGS]: await app.getApplicationForms(appInstall),
        };
    }

    public async changeStateOfApplication(name: string, user: string, enabled: boolean): Promise<void> {
        const appInstall = await this.loadApplicationInstall(name, user);
        appInstall.setEnabled(enabled);
        await this.repository.update(appInstall);
    }

    public async uninstallApplication(name: string, user: string): Promise<void> {
        const appInstall = await this.loadApplicationInstall(name, user);
        await this.repository.remove(appInstall);
    }

    public async detailApplication(name: string, user: string): Promise<Record<string, unknown>> {
        const appInstall = await this.loadApplicationInstall(name, user);
        const app = this.getApplication(appInstall.getName()) as AApplication;
        return {
            ...app.toArray(),
            [AUTHORIZED]: app.isAuthorized(appInstall),
            enabled: appInstall.isEnabled(),
            [APPLICATION_SETTINGS]: await app.getApplicationForms(appInstall),
            webhookSettings: isWebhook(app.getApplicationType())
                ? await this.webhookManager.getWebhooks(app, user)
                : [],
        };
    }

    public async userApplications(user: string): Promise<Record<string, unknown>> {
        const appInstalls = await this.repository.findMany({ users: [user], enabled: null });
        return {
            items: appInstalls.map((appInstall) => {
                let app: IApplication | undefined;
                try {
                    app = this.getApplication(appInstall.getName()) as AApplication;
                } catch (e) {
                    //
                }

                return {
                    ...appInstall.toArray(),
                    [AUTHORIZED]: app?.isAuthorized(appInstall) ?? false,
                };
            }),
        };
    }

    public async userApplicationsLimit(user: string, applications: string[]): Promise<string[]> {
        const appInstalls = await this.repository.findMany(
            { users: [user], keys: applications, enabled: true },
        );
        return appInstalls.map((appInstall) => {
            const limiterForm = appInstall.getSettings()?.[CoreFormsEnum.LIMITER_FORM];

            const useLimit = limiterForm?.[USE_LIMIT] ?? undefined;
            const time = limiterForm?.[TIME] ?? undefined;
            const value = limiterForm?.[VALUE] ?? undefined;

            if (!useLimit || !time || !value) {
                return '';
            }

            const groupTime = limiterForm?.[GROUP_TIME] ?? undefined;
            const groupValue = limiterForm?.[GROUP_VALUE] ?? undefined;

            const key = `${appInstall.getUser()}|${appInstall.getName()}`;

            if (groupTime && groupValue) {
                return getLimiterKeyWithGroup(
                    key,
                    time,
                    value,
                    `|${appInstall.getName()}`,
                    groupTime,
                    groupValue,
                );
            }

            return getLimiterKey(key, time, value);
        }).filter((limit) => limit);
    }

    private async loadApplicationInstall(name: string, user: string): Promise<ApplicationInstall> {
        const appInstall = await this.repository.findByNameAndUser(name, user, null);
        if (!appInstall) {
            throw Error(`ApplicationInstall with user [${user}] and name [${name}] has not been found!`);
        }

        return appInstall;
    }

}
