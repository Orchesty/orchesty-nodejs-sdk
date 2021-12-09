import { BodyInit } from 'node-fetch';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import RequestDto from '../../Transport/Curl/RequestDto';
import { IApplicationArray } from './AApplication';
import HttpMethods from '../../Transport/HttpMethods';
import { IName } from '../../Commons/IName';
import ProcessDto from '../../Utils/ProcessDto';
import ApplicationTypeEnum from './ApplicationTypeEnum';

export interface IApplication extends IName {

  getRequestDto
  (
    dto: ProcessDto,
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: BodyInit,
  ): RequestDto | Promise<RequestDto>;

  getAuthorizationType(): AuthorizationTypeEnum;

  getApplicationType(): ApplicationTypeEnum;

  setApplicationSettings(
    applicationInstall: ApplicationInstall,
    settings: IApplicationSettings
  ): Promise<ApplicationInstall> | ApplicationInstall;

  isAuthorized(applicationInstall: ApplicationInstall): boolean;

  toArray(): IApplicationArray;
}
