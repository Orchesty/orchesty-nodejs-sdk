import { Request } from 'express';
import * as fs from 'fs';
import { contentType } from 'mime-types';
import path from 'path';
import AuthorizationTypeEnum from '../../Authorization/AuthorizationTypeEnum';
import logger from '../../Logger/Logger';
import RequestDto from '../../Transport/Curl/RequestDto';
import AProcessDto from '../../Utils/AProcessDto';
import { ApplicationInstall, IApplicationSettings } from '../Database/ApplicationInstall';
import Field from '../Model/Form/Field';
import FieldType from '../Model/Form/FieldType';
import Form, { IForm } from '../Model/Form/Form';
import FormStack from '../Model/Form/FormStack';
import ApplicationTypeEnum from './ApplicationTypeEnum';
import CoreFormsEnum, { getFormName } from './CoreFormsEnum';
import { IApplication } from './IApplication';

export const USE_LIMIT = 'useLimit';
export const VALUE = 'value';
export const TIME = 'time';

export const GROUP_VALUE = 'groupValue';
export const GROUP_TIME = 'groupTime';

export interface IApplicationArray {
    name: string;
    logo: string | null;
    authorization_type: AuthorizationTypeEnum;
    application_type: ApplicationTypeEnum;
    key: string;
    description: string;
    info: string;
    isInstallable: boolean;
}

export default abstract class AApplication implements IApplication {

    protected logoFilename = ''; // Unless we update from commonJs to at least es2020, it has to be defined in child

    protected infoFilename = '';

    protected isInstallable = true;

    public abstract getAuthorizationType(): AuthorizationTypeEnum;

    public abstract getPublicName(): string;

    public abstract getName(): string;

    public abstract getDescription(): string;

    public abstract getFormStack(): FormStack;

    public abstract isAuthorized(applicationInstall: ApplicationInstall): boolean;

    public abstract getRequestDto(
        dto: AProcessDto,
        applicationInstall: ApplicationInstall,
        method: string,
        url?: string,
        data?: unknown,
    ): Promise<RequestDto> | RequestDto;

    public getApplicationType(): ApplicationTypeEnum {
        return ApplicationTypeEnum.CRON;
    }

    public getLogo(): string | null {
        try {
            if (this.logoFilename && fs.existsSync(this.logoFilename)) {
                const bitmap = fs.readFileSync(this.logoFilename);
                const mimeType = contentType(path.extname(this.logoFilename));

                return `data:${mimeType};base64, ${Buffer.from(bitmap).toString('base64')}`;
            }
            // eslint-disable-next-line no-empty
        } catch {
        }
        return null;
    }

    public getInfo(): string {
        if (this.infoFilename && fs.existsSync(this.infoFilename)) {
            return fs.readFileSync(this.infoFilename).toString();
        }

        return '';
    }

    public async getApplicationForms(applicationInstall: ApplicationInstall): Promise<Record<string, IForm>> {
        const settings = applicationInstall.getSettings();
        const formStack = this.getFormStack();
        formStack.getForms().forEach((form) => {
            form.getFields().forEach((field) => {
                if (form.getKey() in settings && field.getKey() in settings[form.getKey()]) {
                    if (field.getType() === FieldType.PASSWORD) {
                        field.setValue(true);
                    } else {
                        field.setValue(settings[form.getKey()][field.getKey()]);
                    }
                }
            });
        });

        try {
            await this.customFormReplace(formStack, applicationInstall);
            await this.autoInjectLimitForm(formStack, applicationInstall);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            logger.error(e?.message ?? 'Unknown error', { data: JSON.stringify(e) });
        }

        return formStack.toArray();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async saveApplicationForms(
        applicationInstall: ApplicationInstall,
        settings: IApplicationSettings,
    ): Promise<ApplicationInstall> {
        const preparedSettings: IApplicationSettings = {};

        const formStack = this.getFormStack();
        try {
            await this.customFormReplace(formStack, applicationInstall);
            await this.autoInjectLimitForm(formStack, applicationInstall);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            logger.error(e?.message ?? 'Unknown error', { data: JSON.stringify(e) });
        }

        formStack.getForms().forEach((form) => {
            form.getFields().forEach((field) => {
                if (form.getKey() in settings && field.getKey() in settings[form.getKey()]) {
                    const currentFrom = preparedSettings[form.getKey()];
                    if (currentFrom) {
                        preparedSettings[form.getKey()][field.getKey()] = settings[form.getKey()][field.getKey()];
                    } else {
                        preparedSettings[form.getKey()] = { [field.getKey()]: settings[form.getKey()][field.getKey()] };
                    }
                }
            });
        });

        if (Object.keys(preparedSettings).length > 0) {
            applicationInstall.addSettings(preparedSettings);
        }

        return applicationInstall;
    }

    public savePassword(
        applicationInstall: ApplicationInstall,
        formKey: string,
        fieldKey: string,
        password: string,
    ): ApplicationInstall {
        return applicationInstall.addSettings({ [formKey]: { [fieldKey]: password } });
    }

    public getUri(url?: string): URL {
        return new URL(url ?? '');
    }

    public toArray(): IApplicationArray {
        return {
            name: this.getPublicName(),
            authorization_type: this.getAuthorizationType(),
            application_type: this.getApplicationType(),
            key: this.getName(),
            description: this.getDescription(),
            info: this.getInfo(),
            logo: this.getLogo(),
            isInstallable: this.isInstallable,
        };
    }

    public syncAfterInstallCallback(req: Request): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, name } = JSON.parse(req.body);
        // You can find AppInstall by user & name. E.g.: If you want to call topology
    }

    public syncAfterUninstallCallback(req: Request): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, name } = JSON.parse(req.body);
        // You can find AppInstall by user & name. E.g.: If you want to call topology
    }

    public syncAfterEnableCallback(req: Request): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, name } = JSON.parse(req.body);
        // You can find AppInstall by user & name. E.g.: If you want to call topology
    }

    public syncAfterDisableCallback(req: Request): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, name } = JSON.parse(req.body);
        // You can find AppInstall by user & name. E.g.: If you want to call topology
    }

    // eslint-disable-next-line
    protected customFormReplace(forms: FormStack, applicationInstall: ApplicationInstall): void | Promise<void> {
    }

    protected autoInjectLimitForm(forms: FormStack, applicationInstall: ApplicationInstall): Promise<void> | void {
        let limiterForm = forms.getForms().find((it) => it.getKey() === CoreFormsEnum.LIMITER_FORM);

        if (!limiterForm) {
            limiterForm = new Form(CoreFormsEnum.LIMITER_FORM, getFormName(CoreFormsEnum.LIMITER_FORM));
            forms.addForm(limiterForm);
        }

        const useLimit = applicationInstall.getSettings()[CoreFormsEnum.LIMITER_FORM]?.useLimit ?? false;
        limiterForm.addField(new Field(
            FieldType.CHECKBOX,
            USE_LIMIT,
            'Use limit',
            useLimit,
        ));

        const value = applicationInstall.getSettings()[CoreFormsEnum.LIMITER_FORM]?.value ?? undefined;
        limiterForm.addField(new Field(
            FieldType.NUMBER,
            VALUE,
            'Limit per time',
            value,
        ));

        const time = applicationInstall.getSettings()[CoreFormsEnum.LIMITER_FORM]?.time ?? undefined;
        limiterForm.addField(new Field(
            FieldType.NUMBER,
            TIME,
            'Time in seconds',
            time,
        ));
    }

}
