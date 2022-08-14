import { FRONTEND_REDIRECT_URL, IOAuth2Application, OAUTH_REDIRECT_URL } from './IOAuth2Application';
import AApplication, { AUTHORIZATION_FORM } from '../../../Application/Base/AApplication';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import { TOKEN } from '../Basic/ABasicApplication';
import Field from '../../../Application/Model/Form/Field';
import FieldType from '../../../Application/Model/Form/FieldType';
import OAuth2Dto from '../../Provider/Dto/OAuth2Dto';
import {
  ACCESS_TOKEN, EXPIRES, IToken, OAuth2Provider,
} from '../../Provider/OAuth2/OAuth2Provider';
import ScopeSeparatorEnum from '../../ScopeSeparatorEnum';
import { IForm } from '../../../Application/Model/Form/Form';

export default abstract class AOAuth2Application extends AApplication implements IOAuth2Application {
  public constructor(protected _provider: OAuth2Provider) {
    super();
  }

  public abstract getAuthUrl(): string;

  public abstract getTokenUrl(): string;

  public abstract getScopes(applicationInstall: ApplicationInstall): string[];

  public getAuthorizationType = (): AuthorizationTypeEnum => AuthorizationTypeEnum.OAUTH2;

  public authorize(applicationInstall: ApplicationInstall): string {
    return this._provider.authorize(
      this.createDto(applicationInstall),
      this.getScopes(applicationInstall),
      this._getScopesSeparator(),
      this._getProviderCustomOptions(),
    );
  }

  public isAuthorized = (
    applicationInstall: ApplicationInstall,
  ): boolean => !!applicationInstall.getSettings()?.[AUTHORIZATION_FORM]?.[TOKEN]?.[ACCESS_TOKEN];

  public getApplicationForms(applicationInstall: ApplicationInstall): Record<string, IForm> {
    const forms = super.getApplicationForms(applicationInstall);

    const redirectField = new Field(
      FieldType.TEXT,
      OAUTH_REDIRECT_URL,
      'Redirect URL',
      this._provider.getRedirectUri(),
    )
      .setReadOnly(true)
      .toArray;

    if (forms[AUTHORIZATION_FORM]) {
      forms[AUTHORIZATION_FORM].fields.push(redirectField);
    }

    return forms;
  }

  public getFrontendRedirectUrl = (
    applicationInstall: ApplicationInstall,
  ): string => applicationInstall.getSettings()?.[AUTHORIZATION_FORM]?.[FRONTEND_REDIRECT_URL];

  public async refreshAuthorization(applicationInstall: ApplicationInstall): Promise<ApplicationInstall> {
    const token = await this._provider.refreshAccessToken(
      this.createDto(applicationInstall),
      this.getTokens(applicationInstall),
      this._getProviderCustomOptions(),
    );

    applicationInstall.setExpires(token[EXPIRES] ?? undefined);

    const settings = applicationInstall.getSettings();
    settings[AUTHORIZATION_FORM][TOKEN] = token;
    applicationInstall.setSettings(settings);

    return applicationInstall;
  }

  public async setAuthorizationToken(
    applicationInstall: ApplicationInstall,
    token: Record<string, string>,
  ): Promise<void> {
    const tokenFromProvider = await this._provider.getAccessToken(
      this.createDto(applicationInstall),
      token.code,
      this.getScopes(applicationInstall),
      this._getScopesSeparator(),
      this._getProviderCustomOptions(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applicationInstall.setExpires((tokenFromProvider as any)[EXPIRES] ?? undefined);

    if (Object.prototype.hasOwnProperty.call(tokenFromProvider, EXPIRES)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tokenFromProvider as any)[EXPIRES] = (tokenFromProvider as any)[EXPIRES].toString();
    }

    const settings = applicationInstall.getSettings();
    settings[AUTHORIZATION_FORM][TOKEN] = tokenFromProvider;
    applicationInstall.setSettings(settings);
  }

  public setFrontendRedirectUrl = (applicationInstall: ApplicationInstall, redirectUrl: string): void => {
    const settings = applicationInstall.getSettings();
    settings[AUTHORIZATION_FORM][FRONTEND_REDIRECT_URL] = redirectUrl;
    applicationInstall.setSettings(settings);
  };

  public getAccessToken = (applicationInstall: ApplicationInstall): string => {
    if (applicationInstall.getSettings()[AUTHORIZATION_FORM][TOKEN][ACCESS_TOKEN]) {
      return applicationInstall.getSettings()[AUTHORIZATION_FORM][TOKEN][ACCESS_TOKEN];
    }
    throw new Error('There is no access token');
  };

  public createDto(applicationInstall: ApplicationInstall, redirectUrl = ''): OAuth2Dto {
    const dto = new OAuth2Dto(applicationInstall, this.getAuthUrl(), this.getTokenUrl());
    dto.setCustomAppDependencies(applicationInstall.getUser(), applicationInstall.getName());

    if (redirectUrl) {
      dto.setRedirectUrl(redirectUrl);
    }
    return dto;
  }

  public getTokens = (
    applicationInstall: ApplicationInstall,
  ): IToken => applicationInstall.getSettings()?.[AUTHORIZATION_FORM]?.[TOKEN];

  protected _getScopesSeparator = (): string => ScopeSeparatorEnum.COMMA;

  protected _getProviderCustomOptions = (): Record<string, unknown> => ({
    options: {
      authorizationMethod: 'body',
    },
  });
}
