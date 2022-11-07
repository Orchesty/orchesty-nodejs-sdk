import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import { IName } from '../../Commons/IName';
import RequestDto from '../../Transport/Curl/RequestDto';
import { HttpMethods } from '../../Transport/HttpMethods';
import AProcessDto from '../../Utils/AProcessDto';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import { IApplicationArray } from './AApplication';
import ApplicationTypeEnum from './ApplicationTypeEnum';

export interface IApplication extends IName {

    getRequestDto
    (
        dto: AProcessDto,
        applicationInstall: ApplicationInstall,
        method: HttpMethods,
        url?: string,
        data?: unknown,
    ): Promise<RequestDto> | RequestDto;

    getAuthorizationType(): AuthorizationTypeEnum;

    getApplicationType(): ApplicationTypeEnum;

    saveApplicationForms(
        applicationInstall: ApplicationInstall,
        settings: IApplicationSettings,
    ): ApplicationInstall | Promise<ApplicationInstall>;

    savePassword(
        applicationInstall: ApplicationInstall,
        formKey: string,
        fieldKey: string,
        password: string,
    ): ApplicationInstall;

    isAuthorized(applicationInstall: ApplicationInstall): boolean;

    toArray(): IApplicationArray;
}
