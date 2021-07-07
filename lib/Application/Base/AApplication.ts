import { IApplication } from './IApplication';
import Form from '../Model/Form/Form';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import FieldType from '../Model/Form/FieldType';
import ApplicationTypeEnum from './ApplicationTypeEnum';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import RequestDto from '../../Transport/Curl/RequestDto';
import { IFieldArray } from '../Model/Form/Field';

export const FORM = 'form';
export const AUTHORIZATION_SETTINGS = 'authorization_settings';

export interface IApplicationArray {
    name: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    authorization_type: AuthorizationTypeEnum;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    application_type: ApplicationTypeEnum;
    key: string;
    description: string;
}

export default abstract class AApplication implements IApplication {
    public abstract getAuthorizationType(): AuthorizationTypeEnum;

    public abstract getPublicName(): string;

    public abstract getName(): string;

    public abstract getDescription(): string;

    public abstract getSettingsForm(): Form;

    public getApplicationType = (): ApplicationTypeEnum => ApplicationTypeEnum.CRON

    public abstract isAuthorized(applicationInstall: ApplicationInstall): boolean;

    public abstract getRequestDto(
        applicationInstall: ApplicationInstall,
        method: string,
        url?: string,
        data?: string
    ): RequestDto | Promise<RequestDto>;

    public getApplicationForm(applicationInstall: ApplicationInstall): IFieldArray[] {
      const settings = applicationInstall.getSettings()[FORM] ?? [];
      const form = this.getSettingsForm();
      form.fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(settings, field.type)) {
          if (field.type === FieldType.PASSWORD) {
            field.setValue(true);
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
      };
    }
}
