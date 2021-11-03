import {
  CLIENT_ID, CLIENT_SECRET, FRONTEND_REDIRECT_URL, IOAuth2Application,
} from './IOAuth2Application';
import AApplication, { AUTHORIZATION_SETTINGS, FORM } from '../../../Application/Base/AApplication';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';
import { ApplicationInstall, IApplicationSettings } from '../../../Application/Database/ApplicationInstall';
import { TOKEN } from '../Basic/ABasicApplication';
import Field, { IFieldArray } from '../../../Application/Model/Form/Field';
import FieldType from '../../../Application/Model/Form/FieldType';
import OAuth2Dto from '../../Provider/Dto/OAuth2Dto';
import {
  ACCESS_TOKEN, EXPIRES, IToken, OAuth2Provider,
} from '../../Provider/OAuth2/OAuth2Provider';
import ScopeSeparatorEnum from '../../ScopeSeparatorEnum';

export const CREDENTIALS = [
  CLIENT_ID,
  CLIENT_SECRET,
];

export default abstract class AOAuth2Application extends AApplication implements IOAuth2Application {
  constructor(private _provider: OAuth2Provider) {
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
    );
  }

  public isAuthorized = (
    applicationInstall: ApplicationInstall,
  ): boolean => !!applicationInstall.getSettings()[AUTHORIZATION_SETTINGS][TOKEN][ACCESS_TOKEN];

  public getApplicationForm(applicationInstall: ApplicationInstall): IFieldArray[] {
    const formFields = super.getApplicationForm(applicationInstall);

    const redirectField = new Field(
      FieldType.TEXT,
      FRONTEND_REDIRECT_URL,
      'Redirect URL',
      this._provider.getRedirectUri(),
    ).setReadOnly(true).toArray;

    formFields.push(redirectField);

    return formFields;
  }

  public getFrontendRedirectUrl = (
    applicationInstall: ApplicationInstall,
  ): string => applicationInstall.getSettings()[AUTHORIZATION_SETTINGS][FRONTEND_REDIRECT_URL];

  public async refreshAuthorization(applicationInstall: ApplicationInstall): Promise<ApplicationInstall> {
    const token = await this._provider.refreshAccessToken(
      this.createDto(applicationInstall),
      this.getTokens(applicationInstall),
    );

    applicationInstall.setExpires(token[EXPIRES] ?? undefined);

    const settings = applicationInstall.getSettings();
    settings[AUTHORIZATION_SETTINGS][TOKEN] = token;
    applicationInstall.setSettings(settings);

    return applicationInstall;
  }

  public async setAuthorizationToken(
    applicationInstall: ApplicationInstall,
    token: { [key: string]: string },
  ): Promise<void> {
    const tokenFromProvider = await this._provider.getAccessToken(this.createDto(applicationInstall), token.code);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applicationInstall.setExpires((tokenFromProvider as any)[EXPIRES] ?? undefined);

    if (Object.prototype.hasOwnProperty.call(tokenFromProvider, EXPIRES)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tokenFromProvider as any)[EXPIRES] = (tokenFromProvider as any)[EXPIRES].toString();
    }

    const settings = applicationInstall.getSettings();
    this._createAuthSettings(applicationInstall);
    settings[AUTHORIZATION_SETTINGS][TOKEN] = tokenFromProvider;
    applicationInstall.setSettings(settings);
  }

  public setFrontendRedirectUrl(applicationInstall: ApplicationInstall, redirectUrl: string): void {
    this._createAuthSettings(applicationInstall);
    const settings = applicationInstall.getSettings();
    settings[AUTHORIZATION_SETTINGS][FRONTEND_REDIRECT_URL] = redirectUrl;
    applicationInstall.setSettings(settings);
  }

  public getAccessToken = (applicationInstall: ApplicationInstall): string => {
    if (applicationInstall.getSettings()[AUTHORIZATION_SETTINGS][TOKEN][ACCESS_TOKEN]) {
      return applicationInstall.getSettings()[AUTHORIZATION_SETTINGS][TOKEN][ACCESS_TOKEN];
    }
    throw new Error('There is no access token');
  };

  public async setApplicationSettings(
    applicationInstall: ApplicationInstall,
    settings: IApplicationSettings,
  ): Promise<ApplicationInstall> {
    await super.setApplicationSettings(applicationInstall, settings);
    this._createAuthSettings(applicationInstall);

    const sett = applicationInstall.getSettings();
    Object.entries(sett[FORM]).forEach((item) => {
      if (CREDENTIALS.includes(item[0])) {
        // eslint-disable-next-line prefer-destructuring
        sett[AUTHORIZATION_SETTINGS][item[0]] = item[1];
      }
    });
    applicationInstall.setSettings(sett);

    return applicationInstall;
  }

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
  ): IToken => applicationInstall.getSettings()[AUTHORIZATION_SETTINGS][TOKEN];

  protected _getScopesSeparator = (): string => ScopeSeparatorEnum.COMMA;

  private _createAuthSettings = (applicationInstall: ApplicationInstall): ApplicationInstall => {
    if (!Object.prototype.hasOwnProperty.call(applicationInstall.getSettings(), AUTHORIZATION_SETTINGS)) {
      applicationInstall.addSettings({ [AUTHORIZATION_SETTINGS]: {} });
      return applicationInstall;
    }
    return applicationInstall;
  };
}
