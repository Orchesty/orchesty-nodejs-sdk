import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import RequestDto from '../../Transport/Curl/RequestDto';
import { IApplicationArray } from './ApplicationAbstract';
import HttpMethods from '../../Transport/HttpMethods';

export interface IApplication {

    getRequestDto
    (
        applicationInstall: ApplicationInstall,
        method: HttpMethods,
        url?: string,
        data?: string,
    ): RequestDto;

    getAuthorizationType(): AuthorizationTypeEnum;

    setApplicationSettings(applicationInstall: ApplicationInstall, settings: IApplicationSettings): ApplicationInstall;

    isAuthorized(applicationInstall: ApplicationInstall): boolean;

    toArray(): IApplicationArray;
}
