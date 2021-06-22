export interface IOAuth2Dto {
    getClientId(): string;

    getClientSecret(): string;

    setRedirectUrl(redirectUrl: string): IOAuth2Dto;

    isRedirectUrl(): boolean;

    getRedirectUrl(): string;

    getAuthorizationUrl(): string;

    getTokenUrl(): string;

    isCustomApp(): boolean;

    getUser(): string;

    getApplicationKey(): string;

    setCustomAppDependencies(user: string, applicationKey: string): void;
}
