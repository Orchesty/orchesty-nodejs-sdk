import AApplication, { AUTHORIZATION_FORM } from '../../../Application/Base/AApplication';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';
import { IBasicApplication } from './IBasicApplication';

export const USER = 'user';
export const PASSWORD = 'password';
export const TOKEN = 'token';

export abstract class ABasicApplication extends AApplication implements IBasicApplication {
  public getAuthorizationType = (): AuthorizationTypeEnum => AuthorizationTypeEnum.BASIC;

  public isAuthorized = (applicationInstall: ApplicationInstall): boolean => {
    const appInstall = applicationInstall.getSettings()[AUTHORIZATION_FORM];
    return !!appInstall?.[USER] && !!appInstall?.[PASSWORD] || !!appInstall?.[TOKEN];
  };
}
