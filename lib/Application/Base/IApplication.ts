import { BodyInit } from 'node-fetch';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import RequestDto from '../../Transport/Curl/RequestDto';
import { IApplicationArray } from './AApplication';
import HttpMethods from '../../Transport/HttpMethods';
import { IName } from '../../Commons/IName';
import ApplicationTypeEnum from './ApplicationTypeEnum';
import AProcessDto from '../../Utils/AProcessDto';

export interface IApplication extends IName {

  getRequestDto
  (
    dto: AProcessDto,
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: BodyInit|unknown,
  ): RequestDto | Promise<RequestDto>;

  getAuthorizationType(): AuthorizationTypeEnum;

  getApplicationType(): ApplicationTypeEnum;

  saveApplicationForms(
    applicationInstall: ApplicationInstall,
    settings: IApplicationSettings
  ): Promise<ApplicationInstall> | ApplicationInstall;

  savePassword(
    applicationInstall: ApplicationInstall,
    formKey: string,
    fieldKey: string,
    password: string,
  ): ApplicationInstall;

  isAuthorized(applicationInstall: ApplicationInstall): boolean;

  toArray(): IApplicationArray;
}
