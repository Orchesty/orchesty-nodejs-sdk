import AApplication from '../../../Application/Base/AApplication';
import CoreFormsEnum from '../../../Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';
import { IBasicApplication } from './IBasicApplication';

export const USER = 'user';
export const PASSWORD = 'password';
export const TOKEN = 'token';

export abstract class ABasicApplication extends AApplication implements IBasicApplication {

    public getAuthorizationType(): AuthorizationTypeEnum {
        return AuthorizationTypeEnum.BASIC;
    }

    public isAuthorized(applicationInstall: ApplicationInstall): boolean {
        const appInstall = applicationInstall.getSettings()[CoreFormsEnum.AUTHORIZATION_FORM];
        return Boolean(appInstall?.[USER]) && Boolean(appInstall?.[PASSWORD]) || Boolean(appInstall?.[TOKEN]);
    }

}
