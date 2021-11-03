import AApplication, { AUTHORIZATION_SETTINGS, FORM } from '../../../Application/Base/AApplication';
import { IBasicApplication } from './IBasicApplication';
import { ApplicationInstall, IApplicationSettings } from '../../../Application/Database/ApplicationInstall';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';

export const USER = 'user';
export const PASSWORD = 'password';
export const TOKEN = 'token';

export abstract class ABasicApplication extends AApplication implements IBasicApplication {
  public getAuthorizationType = (): AuthorizationTypeEnum => AuthorizationTypeEnum.BASIC;

  public isAuthorized = (applicationInstall: ApplicationInstall): boolean => {
    const appInstall = applicationInstall.getSettings()[AUTHORIZATION_SETTINGS];
    return ((!!appInstall?.[USER] && !!appInstall?.[PASSWORD]) || !!appInstall?.[TOKEN]);
  };

  public setApplicationUser(applicationInstall: ApplicationInstall, user: string): ApplicationInstall {
    const settings = this._createAuthSettings(applicationInstall).getSettings();

    settings[AUTHORIZATION_SETTINGS][USER] = user;
    return applicationInstall.addSettings(settings);
  }

  public setApplicationPassword(applicationInstall: ApplicationInstall, password: string): ApplicationInstall {
    const settings = this._createAuthSettings(applicationInstall).getSettings();
    settings[AUTHORIZATION_SETTINGS][PASSWORD] = password;

    return applicationInstall.addSettings(settings);
  }

  public setApplicationToken(applicationInstall: ApplicationInstall, token: string): ApplicationInstall {
    const settings = this._createAuthSettings(applicationInstall).getSettings();

    settings[AUTHORIZATION_SETTINGS][TOKEN] = token;
    return applicationInstall.addSettings(settings);
  }

  public async setApplicationSettings(applicationInstall: ApplicationInstall, settings: IApplicationSettings):
    Promise<ApplicationInstall> {
    const appInstall = await super.setApplicationSettings(applicationInstall, settings);

    if (Object.prototype.hasOwnProperty.call(settings, FORM)) {
      const sett = settings[FORM];
      if (Object.prototype.hasOwnProperty.call(sett, USER)) {
        this.setApplicationUser(appInstall, sett[USER]);
      }
      if (Object.prototype.hasOwnProperty.call(sett, PASSWORD)) {
        this.setApplicationPassword(appInstall, sett[PASSWORD]);
      }
      if (Object.prototype.hasOwnProperty.call(sett, TOKEN)) {
        this.setApplicationToken(appInstall, sett[TOKEN]);
      }
    }

    return appInstall;
  }

  private _createAuthSettings = (applicationInstall: ApplicationInstall): ApplicationInstall => {
    if (!Object.prototype.hasOwnProperty.call(applicationInstall.getSettings(), AUTHORIZATION_SETTINGS)) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      applicationInstall.addSettings({ authorization_settings: {} });
      return applicationInstall;
    }
    return applicationInstall;
  };
}
