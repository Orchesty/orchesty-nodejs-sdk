import { IOAuth2Dto } from './IOAuth2Dto';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import { AUTHORIZATION_SETTINGS } from '../../../Application/Base/AApplication';
import { CLIENT_ID, CLIENT_SECRET } from '../../Type/OAuth2/IOAuth2Application';

export default class OAuth2Dto implements IOAuth2Dto {
  private readonly _clientId = '';

  private readonly _clientSecret = '';

  private _redirectUrl = '';

  private _user = '';

  private _applicationName = '';

  constructor(authorization: ApplicationInstall, private _authorizeUrl: string, private _tokenUrl: string) {
    this._clientId = authorization.getSettings()?.[AUTHORIZATION_SETTINGS]?.[CLIENT_ID] ?? '';
    this._clientSecret = authorization.getSettings()?.[AUTHORIZATION_SETTINGS]?.[CLIENT_SECRET] ?? '';
  }

  public getApplicationKey(): string {
    return this._applicationName;
  }

  public getAuthorizationUrl(): string {
    return this._authorizeUrl;
  }

  public getClientId(): string {
    return this._clientId;
  }

  public getClientSecret(): string {
    return this._clientSecret;
  }

  public getRedirectUrl(): string {
    return this._redirectUrl;
  }

  public getTokenUrl(): string {
    return this._tokenUrl;
  }

  public getUser(): string {
    return this._user;
  }

  public isCustomApp(): boolean {
    return (!!this._user && !!this._applicationName);
  }

  public isRedirectUrl(): boolean {
    return !!this._redirectUrl;
  }

  public setCustomAppDependencies(user: string, applicationName: string): void {
    this._user = user;
    this._applicationName = applicationName;
  }

  public setRedirectUrl(redirectUrl: string): IOAuth2Dto {
    this._redirectUrl = redirectUrl;
    return this;
  }
}
