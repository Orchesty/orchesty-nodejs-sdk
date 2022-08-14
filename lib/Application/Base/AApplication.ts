import * as fs from 'fs';
import { contentType } from 'mime-types';
import { BodyInit } from 'node-fetch';
import path from 'path';
import { IApplication } from './IApplication';
import { IForm } from '../Model/Form/Form';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import FieldType from '../Model/Form/FieldType';
import ApplicationTypeEnum from './ApplicationTypeEnum';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import RequestDto from '../../Transport/Curl/RequestDto';
import FormStack from '../Model/Form/FormStack';
import AProcessDto from '../../Utils/AProcessDto';

export const AUTHORIZATION_FORM = 'authorization_form';

export interface IApplicationArray {
  name: string;
  logo: string|null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  authorization_type: AuthorizationTypeEnum;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  application_type: ApplicationTypeEnum;
  key: string;
  description: string;
}

export default abstract class AApplication implements IApplication {
  protected _logoFilename = 'logo.svg';

  public abstract getAuthorizationType (): AuthorizationTypeEnum;

  public abstract getPublicName (): string;

  public abstract getName (): string;

  public abstract getDescription (): string;

  public abstract getFormStack (): FormStack;

  public getApplicationType = (): ApplicationTypeEnum => ApplicationTypeEnum.CRON;

  public abstract isAuthorized(applicationInstall: ApplicationInstall): boolean;

  public abstract getRequestDto (
    dto: AProcessDto,
    applicationInstall: ApplicationInstall,
    method: string,
    url?: string,
    data?: BodyInit|unknown // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
  ): Promise<RequestDto> | RequestDto;

  public getLogo(): string | null {
    try {
      if (fs.existsSync(this._logoFilename)) {
        const bitmap = fs.readFileSync(this._logoFilename);
        const mimeType = contentType(path.extname(this._logoFilename));

        return `data:${mimeType};base64, ${Buffer.from(bitmap).toString('base64')}`;
      }
      // eslint-disable-next-line no-empty
    } catch {}
    return null;
  }

  public getApplicationForms(applicationInstall: ApplicationInstall): Record<string, IForm> {
    const settings = applicationInstall.getSettings();
    const formStack = this.getFormStack();
    formStack.getForms().forEach((form) => {
      form.fields.forEach((field) => {
        if (form.key in settings && field.key in settings[form.key]) {
          if (field.type === FieldType.PASSWORD) {
            field.setValue(true);
          } else {
            field.setValue(settings[form.key][field.key]);
          }
        }
      });
    });

    this._customFormReplace(formStack, applicationInstall);

    return formStack.toArray();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async saveApplicationForms(
    applicationInstall: ApplicationInstall,
    settings: IApplicationSettings,
  ): Promise<ApplicationInstall> {
    const preparedSettings: IApplicationSettings = {};

    this.getFormStack().getForms().forEach((form) => {
      form.fields.forEach((field) => {
        if (form.key in settings && field.key in settings[form.key]) {
          const currentFrom = preparedSettings[form.key];
          if (currentFrom) {
            preparedSettings[form.key][field.key] = settings[form.key][field.key];
          } else {
            preparedSettings[form.key] = { [field.key]: settings[form.key][field.key] };
          }
        }
      });
    });

    if (Object.keys(preparedSettings).length > 0) {
      applicationInstall.addSettings(preparedSettings);
    }

    return applicationInstall;
  }

  public savePassword = (
    applicationInstall: ApplicationInstall,
    formKey: string,
    fieldKey: string,
    password: string,
  ): ApplicationInstall => applicationInstall.addSettings({ [formKey]: { [fieldKey]: password } });

  public getUri = (url?: string): URL => new URL(url ?? '');

  public toArray(): IApplicationArray {
    return {
      name: this.getPublicName(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      authorization_type: this.getAuthorizationType(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      application_type: this.getApplicationType(),
      key: this.getName(),
      description: this.getDescription(),
      logo: this.getLogo(),
    };
  }

  // eslint-disable-next-line
  protected _customFormReplace(forms: FormStack, applicationInstall: ApplicationInstall): void {
  }
}
