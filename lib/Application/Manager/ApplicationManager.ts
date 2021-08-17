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
  ): Promise<ApplicationInstall> {
    const app = this.getApplication(name);
    const appInstall = await this._loadApplicationInstall(name, user);

    return app.setApplicationSettings(appInstall as ApplicationInstall, data);
  }

  public async saveApplicationPassword(name: string, user: string, password: string): Promise<ApplicationInstall> {
    const app = this.getApplication(name) as IBasicApplication;
    const appInstall = await this._loadApplicationInstall(name, user);

    return app.setApplicationPassword(appInstall, password);
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

  public async installApplication(name: string, user: string) {
    const repo = await this._getRepository();
    let appInstall: ApplicationInstall|null = await repo.findByNameAndUser(name, user);
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
      authorized: app.isAuthorized(appInstall),
      applicationSettings: app.getApplicationForm(appInstall),
    };
  }

  public async uninstallApplication(name: string, user: string) {
    const repo = await this._getRepository();
    const appInstall: ApplicationInstall | null = await repo.findByNameAndUser(name, user);
    if (!appInstall) {
      // Todo : need to be changed to custom error that doesn't return 500
      throw Error(`ApplicationInstall with user [${user}] and name [${name}] not found !`);
    }
    await repo.remove(appInstall);
    return 'application removed successfully';
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
