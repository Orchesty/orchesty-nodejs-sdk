import AApplication from '../../../Application/Base/AApplication';
import CoreFormsEnum from '../../../Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import Field from '../../../Application/Model/Form/Field';
import FieldType from '../../../Application/Model/Form/FieldType';
import { IForm } from '../../../Application/Model/Form/Form';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';
import OAuth2Dto from '../../Provider/Dto/OAuth2Dto';
import { ACCESS_TOKEN, EXPIRES, IToken, OAuth2Provider } from '../../Provider/OAuth2/OAuth2Provider';
import ScopeSeparatorEnum from '../../ScopeSeparatorEnum';
import { TOKEN } from '../Basic/ABasicApplication';
import { FRONTEND_REDIRECT_URL, IOAuth2Application, OAUTH_REDIRECT_URL } from './IOAuth2Application';

export default abstract class AOAuth2Application extends AApplication implements IOAuth2Application {

    public constructor(protected provider: OAuth2Provider) {
        super();
    }

    public abstract getAuthUrl(): string;

    public abstract getTokenUrl(): string;

    public abstract getScopes(applicationInstall: ApplicationInstall): string[];

    public getAuthorizationType(): AuthorizationTypeEnum {
        return AuthorizationTypeEnum.OAUTH2;
    }

    public authorize(applicationInstall: ApplicationInstall): string {
        return this.provider.authorize(
            this.createDto(applicationInstall),
            this.getScopes(applicationInstall),
            this.getScopesSeparator(),
            this.getProviderCustomOptions(applicationInstall),
        );
    }

    public isAuthorized(
        applicationInstall: ApplicationInstall,
    ): boolean {
        return Boolean(applicationInstall.getSettings()?.[CoreFormsEnum.AUTHORIZATION_FORM]?.[TOKEN]?.[ACCESS_TOKEN]);
    }

    public async getApplicationForms(applicationInstall: ApplicationInstall): Promise<Record<string, IForm>> {
        const forms = await super.getApplicationForms(applicationInstall);

        const redirectField = new Field(
            FieldType.TEXT,
            OAUTH_REDIRECT_URL,
            'Redirect URL',
            this.provider.getRedirectUri(),
        )
            .setReadOnly(true)
            .toArray();

        if (forms[CoreFormsEnum.AUTHORIZATION_FORM]) {
            forms[CoreFormsEnum.AUTHORIZATION_FORM].fields.push(redirectField);
        }

        return forms;
    }

    public getFrontendRedirectUrl(
        applicationInstall: ApplicationInstall,
    ): string {
        return applicationInstall.getSettings()?.[CoreFormsEnum.AUTHORIZATION_FORM]?.[FRONTEND_REDIRECT_URL];
    }

    public async refreshAuthorization(applicationInstall: ApplicationInstall): Promise<ApplicationInstall> {
        const token = await this.provider.refreshAccessToken(
            this.createDto(applicationInstall),
            this.getTokens(applicationInstall),
            this.getProviderCustomOptions(applicationInstall),
        );

        applicationInstall.setExpires(token[EXPIRES] ?? undefined);
        applicationInstall.addSettings({ [CoreFormsEnum.AUTHORIZATION_FORM]: { [TOKEN]: token } });

        return applicationInstall;
    }

    public async setAuthorizationToken(
        applicationInstall: ApplicationInstall,
        token: Record<string, string>,
    ): Promise<void> {
        const tokenFromProvider = await this.provider.getAccessToken(
            this.createDto(applicationInstall),
            token.code,
            this.getScopes(applicationInstall),
            this.getScopesSeparator(),
            this.getProviderCustomOptions(applicationInstall),
        );

        applicationInstall.setExpires(tokenFromProvider[EXPIRES] ?? undefined);

        if (Object.hasOwn(tokenFromProvider, EXPIRES) && tokenFromProvider[EXPIRES] !== undefined) {
            tokenFromProvider[EXPIRES] = tokenFromProvider[EXPIRES].toString();
        }

        applicationInstall.addSettings({
            [CoreFormsEnum.AUTHORIZATION_FORM]: { [TOKEN]: tokenFromProvider },
        });
    }

    public setFrontendRedirectUrl(applicationInstall: ApplicationInstall, redirectUrl: string): void {
        applicationInstall.addSettings(
            { [CoreFormsEnum.AUTHORIZATION_FORM]: { [FRONTEND_REDIRECT_URL]: redirectUrl } },
        );
    }

    public getAccessToken(applicationInstall: ApplicationInstall): string {
        if (applicationInstall.getSettings()[CoreFormsEnum.AUTHORIZATION_FORM][TOKEN][ACCESS_TOKEN]) {
            return applicationInstall.getSettings()[CoreFormsEnum.AUTHORIZATION_FORM][TOKEN][ACCESS_TOKEN];
        }
        throw new Error('There is no access token');
    }

    public createDto(applicationInstall: ApplicationInstall, redirectUrl = ''): OAuth2Dto {
        const dto = new OAuth2Dto(applicationInstall, this.getAuthUrl(), this.getTokenUrl());
        dto.setCustomAppDependencies(applicationInstall.getUser(), applicationInstall.getName());

        if (redirectUrl) {
            dto.setRedirectUrl(redirectUrl);
        }
        return dto;
    }

    public getTokens(
        applicationInstall: ApplicationInstall,
    ): IToken {
        return applicationInstall.getSettings()?.[CoreFormsEnum.AUTHORIZATION_FORM]?.[TOKEN];
    }

    protected getScopesSeparator(): string {
        return ScopeSeparatorEnum.COMMA;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected getProviderCustomOptions(applicationInstall: ApplicationInstall): Record<string, unknown> {
        return {
            options: {
                authorizationMethod: 'body',
            },
        };
    }

}
