import { Request } from 'express';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import Annotation from '../../Utils/Annotation';
import { IApplication } from '../Base/IApplication';
import { APPLICATION_PREFIX } from '../ApplicationRouter';
import HttpMethods from '../../Transport/HttpMethods';
import { IBasicApplication } from '../../Authorization/Type/Basic/IBasicApplication';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { IOAuth2Application } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import ApplicationInstallRepository from '../Database/ApplicationInstallRepository';
import ApplicationLoader from '../ApplicationLoader';
import AApplication, { IApplicationArray } from '../Base/AApplication';
import { IFieldArray } from '../Model/Form/Field';

const AUTHORIZED = 'authorized';
const APPLICATION_SETTINGS = 'applicationSettings';

export default class ApplicationManager {
  private _repository: ApplicationInstallRepository<ApplicationInstall> | undefined;

  constructor(private _client: MongoDbClient, private _loader: ApplicationLoader) {
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

  public runSynchronousAction(key: string, method: string, request: Request): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = this.getApplication(key) as any;
    const syncMethod = `sync${method[0].toUpperCase()}${method.substr(1)}`;
    if (typeof app[syncMethod] === 'function') {
      if (request.method === HttpMethods.GET) {
        return app[syncMethod]();
      }
      return app[syncMethod](request);
    }
    throw new Error(`Method [${syncMethod}] has not found in application [${key}].`);
  }

  public async saveApplicationSettings(
    name: string,
    user: string,
    data: IApplicationSettings,
  ): Promise<{ [key: string]: unknown | IFieldArray[] }> {
    const app = this.getApplication(name) as AApplication;
    const appInstall = await this._loadApplicationInstall(name, user);

    const res = (await app.setApplicationSettings(appInstall as ApplicationInstall, data)).toArray();
    await (await this._getRepository()).update(appInstall);

    return {
      ...res,
      [APPLICATION_SETTINGS]: app.getApplicationForm(appInstall),
    };
  }

  public async saveApplicationPassword(
    name: string,
    user: string,
    password: string,
  ): Promise<{ [key: string]: unknown }> {
    const app = this.getApplication(name) as IBasicApplication;
    const appInstall = await this._loadApplicationInstall(name, user);

    const res = app.setApplicationPassword(appInstall, password).toArray();
    await (await this._getRepository()).update(appInstall);

    return res;
  }

  public async authorizationApplication(name: string, user: string, redirectUrl: string): Promise<string> {
    const app = this.getApplication(name) as IOAuth2Application;
    const appInstall = await this._loadApplicationInstall(name, user);

    app.setFrontendRedirectUrl(appInstall, redirectUrl);
    await (await this._getRepository()).update(appInstall);

    return app.authorize(appInstall);
  }

  public async saveAuthorizationToken(
    name: string,
    user: string,
    requestParams: { [key: string]: string },
  ): Promise<string> {
    const app = this.getApplication(name) as IOAuth2Application;
    const appInstall = await this._loadApplicationInstall(name, user);
    await app.setAuthorizationToken(appInstall, requestParams);
    await (await this._getRepository()).update(appInstall);
    return app.getFrontendRedirectUrl(appInstall);
  }

  public async installApplication(
    name: string,
    user: string,
  ): Promise<{ [key: string]: unknown | boolean | IFieldArray[] }> {
    const repo = await this._getRepository();
    let appInstall: ApplicationInstall | null = await repo.findByNameAndUser(name, user);
    if (appInstall) {
      // Todo : need to be changed to custom error that doesn't return 500
      throw Error(`ApplicationInstall with user [${user}] and name [${name}] already exists !`);
    }
    appInstall = new ApplicationInstall()
      .setUser(user)
      .setName(name);
    await repo.insert(appInstall);
    const app = (this.getApplication(appInstall.getName()) as AApplication);
    return {
      ...app.toArray(),
      [AUTHORIZED]: app.isAuthorized(appInstall),
      [APPLICATION_SETTINGS]: app.getApplicationForm(appInstall),
    };
  }

  public async uninstallApplication(name: string, user: string): Promise<void> {
    const repo = await this._getRepository();
    const appInstall = await this._loadApplicationInstall(name, user);
    await repo.remove(appInstall);
  }

  public async detailApplication(name: string, user: string): Promise<{ [key: string]: unknown }> {
    const appInstall = await this._loadApplicationInstall(name, user);
    const app = (this.getApplication(appInstall.getName()) as AApplication);
    return {
      ...app.toArray(),
      [AUTHORIZED]: app.isAuthorized(appInstall),
      [APPLICATION_SETTINGS]: app.getApplicationForm(appInstall),
      webhookSettings: [], // TODO add this later
    };
  }

  public async userApplications(user: string): Promise<{ [key: string]: unknown }> {
    const repo = await this._getRepository();
    const appInstalls = await repo.findMany({ user });
    return {
      items: appInstalls.map((appInstall) => {
        const app = (this.getApplication(appInstall.getName()) as AApplication);
        return {
          ...appInstall.toArray(),
          [AUTHORIZED]: app.isAuthorized(appInstall),
        };
      }),
    };
  }

  private async _loadApplicationInstall(name: string, user: string): Promise<ApplicationInstall> {
    const appInstall = await (await this._getRepository()).findByNameAndUser(name, user);
    if (appInstall === null) {
      throw Error(`ApplicationInstall with user [${user}] and name [${name}] has not found!`);
    }

    return appInstall;
  }

  private async _getRepository(): Promise<ApplicationInstallRepository<ApplicationInstall>> {
    if (!this._repository) {
      this._repository = await this._client.getApplicationRepository();
    }

    return this._repository;
  }
}
