import * as fs from 'fs';
import { contentType } from 'mime-types';
import path from 'node:path';
import { IApplication } from './IApplication';
import Form from '../Model/Form/Form';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import FieldType from '../Model/Form/FieldType';
import ApplicationTypeEnum from './ApplicationTypeEnum';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import RequestDto from '../../Transport/Curl/RequestDto';
import { IFieldArray } from '../Model/Form/Field';
import ProcessDto from '../../Utils/ProcessDto';

export const FORM = 'form';
export const AUTHORIZATION_SETTINGS = 'authorization_settings';

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

    public abstract getAuthorizationType(): AuthorizationTypeEnum;

    public abstract getPublicName(): string;

    public abstract getName(): string;

    public abstract getDescription(): string;

    public abstract getSettingsForm(): Form;

    public getApplicationType = (): ApplicationTypeEnum => ApplicationTypeEnum.CRON

    public abstract isAuthorized(applicationInstall: ApplicationInstall): boolean;

    public abstract getRequestDto(
      dto: ProcessDto,
        applicationInstall: ApplicationInstall,
        method: string,
        url?: string,
        data?: string
    ): RequestDto | Promise<RequestDto>;

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

    public getApplicationForm(applicationInstall: ApplicationInstall): IFieldArray[] {
      const settings = applicationInstall.getSettings()[FORM] ?? [];
      const form = this.getSettingsForm();
      form.fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(settings, field.key)) {
          if (field.type === FieldType.PASSWORD) {
            field.setValue(true);
          } else {
            field.setValue(settings[field.key]);
          }
        }
      });

      return form.toArray();
    }

    public setApplicationSettings(applicationInstall: ApplicationInstall, settings: IApplicationSettings):
        ApplicationInstall {
      const preparedSettings: IApplicationSettings = {};

      this.getSettingsForm().fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(settings, field.key)) {
          preparedSettings[field.key] = settings[field.key];
        }
      });
      if (Object.keys(preparedSettings).length > 0) {
        applicationInstall.addSettings({ [FORM]: preparedSettings });
      }

      return applicationInstall;
    }

    public getUri = (url?: string): URL => new URL(url ?? '')

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
}
