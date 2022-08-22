import { AUTHORIZATION_FORM } from '../../../Application/Base/AApplication';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import { CLIENT_ID, CLIENT_SECRET } from '../../Type/OAuth2/IOAuth2Application';
import { IOAuth2Dto } from './IOAuth2Dto';

export default class OAuth2Dto implements IOAuth2Dto {

    private readonly clientId = '';

    private readonly clientSecret = '';

    private redirectUrl = '';

    private user = '';

    private applicationName = '';

    public constructor(
        authorization: ApplicationInstall,
        private readonly authorizeUrl: string,
        private readonly tokenUrl: string,
    ) {
        this.clientId = authorization.getSettings()?.[AUTHORIZATION_FORM]?.[CLIENT_ID] ?? '';
        this.clientSecret = authorization.getSettings()?.[AUTHORIZATION_FORM]?.[CLIENT_SECRET] ?? '';
    }

    public getApplicationKey(): string {
        return this.applicationName;
    }

    public getAuthorizationUrl(): string {
        return this.authorizeUrl;
    }

    public getClientId(): string {
        return this.clientId;
    }

    public getClientSecret(): string {
        return this.clientSecret;
    }

    public getRedirectUrl(): string {
        return this.redirectUrl;
    }

    public getTokenUrl(): string {
        return this.tokenUrl;
    }

    public getUser(): string {
        return this.user;
    }

    public isCustomApp(): boolean {
        return Boolean(this.user) && Boolean(this.applicationName);
    }

    public isRedirectUrl(): boolean {
        return Boolean(this.redirectUrl);
    }

    public setCustomAppDependencies(user: string, applicationName: string): void {
        this.user = user;
        this.applicationName = applicationName;
    }

    public setRedirectUrl(redirectUrl: string): IOAuth2Dto {
        this.redirectUrl = redirectUrl;
        return this;
    }

}
