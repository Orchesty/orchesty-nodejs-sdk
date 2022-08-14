import { Request } from 'express';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import Annotation from '../../Utils/Annotation';
import { IApplication } from '../Base/IApplication';
import { APPLICATION_PREFIX } from '../ApplicationRouter';
import HttpMethods from '../../Transport/HttpMethods';
import { IOAuth2Application } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import ApplicationInstallRepository from '../Database/ApplicationInstallRepository';
import ApplicationLoader from '../ApplicationLoader';
import AApplication, { IApplicationArray } from '../Base/AApplication';
import { IField } from '../Model/Form/Field';
import { isWebhook } from '../Base/ApplicationTypeEnum';
import WebhookManager from './WebhookManager';

const AUTHORIZED = 'authorized';
const APPLICATION_SETTINGS = 'applicationSettings';

export default class ApplicationManager {
  public constructor(
    private readonly _repository: ApplicationInstallRepository<ApplicationInstall>,
    private readonly _loader: ApplicationLoader,
    private readonly _webhookManager: WebhookManager,
  ) {
  }

  public getApplications(): IApplicationArray[] {
    return this._loader.getListApplications();
  }

  public getApplication(key: string): IApplication {
    return ((this._loader.get(APPLICATION_PREFIX, key)) as unknown) as IApplication;
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
        resp = await app[syncMethod]();
      } else {
        resp = await app[syncMethod](request);
      }

      return resp ?? { status: 'ok' };
    }
    throw new Error(`Method [${syncMethod}] has not found in application [${key}].`);
  }

  public async saveApplicationSettings(
    name: string,
    user: string,
    data: IApplicationSettings,
  ): Promise<Record<string, IField[] | unknown>> { // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
    const app = this.getApplication(name) as AApplication;
    const appInstall = await this._loadApplicationInstall(name, user);

    const res = (await app.saveApplicationForms(appInstall, data)).toArray();
    await this._repository.update(appInstall);

    return {
      ...res,
      [APPLICATION_SETTINGS]: app.getApplicationForms(appInstall),
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
    const appInstall = await this._loadApplicationInstall(name, user);

    const res = app.savePassword(appInstall, formKey, fieldKey, password).toArray();
    await this._repository.update(appInstall);

    return {
      ...res,
      [APPLICATION_SETTINGS]: (app as unknown as AApplication).getApplicationForms(appInstall),
    };
  }

  public async authorizationApplication(name: string, user: string, redirectUrl: string): Promise<string> {
    const app = this.getApplication(name) as IOAuth2Application;
    const appInstall = await this._loadApplicationInstall(name, user);

    app.setFrontendRedirectUrl(appInstall, redirectUrl);
    await this._repository.update(appInstall);

    return app.authorize(appInstall);
  }

  public async saveAuthorizationToken(
    name: string,
    user: string,
    requestParams: Record<string, string>,
  ): Promise<string> {
    const app = this.getApplication(name) as IOAuth2Application;
    const appInstall = await this._loadApplicationInstall(name, user);
    await app.setAuthorizationToken(appInstall, requestParams);
    await this._repository.update(appInstall);
    return app.getFrontendRedirectUrl(appInstall);
  }

  public async installApplication(
    name: string,
    user: string,
  ): Promise<Record<string, IField[] | boolean | unknown>> { // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
    let appInstall: ApplicationInstall | null = await this._repository.findByNameAndUser(name, user);
    if (appInstall) {
      // Todo : need to be changed to custom error that doesn't return 500
      throw Error(`ApplicationInstall with user [${user}] and name [${name}] already exists !`);
    }
    appInstall = new ApplicationInstall()
      .setUser(user)
      .setName(name);
    await this._repository.insert(appInstall);
    const app = this.getApplication(appInstall.getName()) as AApplication;
    return {
      ...app.toArray(),
      [AUTHORIZED]: app.isAuthorized(appInstall),
      [APPLICATION_SETTINGS]: app.getApplicationForms(appInstall),
    };
  }

  public async uninstallApplication(name: string, user: string): Promise<void> {
    const appInstall = await this._loadApplicationInstall(name, user);
    await this._repository.remove(appInstall);
  }

  public async detailApplication(name: string, user: string): Promise<Record<string, unknown>> {
    const appInstall = await this._loadApplicationInstall(name, user);
    const app = this.getApplication(appInstall.getName()) as AApplication;
    return {
      ...app.toArray(),
      [AUTHORIZED]: app.isAuthorized(appInstall),
      [APPLICATION_SETTINGS]: app.getApplicationForms(appInstall),
      webhookSettings: isWebhook(app.getApplicationType())
        ? await this._webhookManager.getWebhooks(app, user)
        : [],
    };
  }

  public async userApplications(user: string): Promise<Record<string, unknown>> {
    const appInstalls = await this._repository.findMany({ user });
    return {
      items: appInstalls.map((appInstall) => {
        let app: IApplication|undefined;
        try {
          app = this.getApplication(appInstall.getName()) as AApplication;
        } catch (e) {
          ///
        }

        return {
          ...appInstall.toArray(),
          [AUTHORIZED]: app?.isAuthorized(appInstall) ?? false,
        };
      }),
    };
  }

  private async _loadApplicationInstall(name: string, user: string): Promise<ApplicationInstall> {
    const appInstall = await this._repository.findByNameAndUser(name, user);
    if (appInstall === null) {
      throw Error(`ApplicationInstall with user [${user}] and name [${name}] has not found!`);
    }

    return appInstall;
  }
}
