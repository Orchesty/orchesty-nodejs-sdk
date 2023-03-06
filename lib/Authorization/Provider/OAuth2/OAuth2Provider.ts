import deepmerge from 'deepmerge';
import { AccessToken, AuthorizationCode } from 'simple-oauth2';
import { decode, encode } from '../../../Utils/Base64';
import ScopeSeparatorEnum from '../../ScopeSeparatorEnum';
import AOAuthProvider from '../AOAuthProvider';
import { IOAuth2Dto } from '../Dto/IOAuth2Dto';
import OAuth2Dto from '../Dto/OAuth2Dto';
import { IOAuth2Provider } from './IOAuth2Provider';

export const REFRESH_TOKEN = 'refreshToken';
export const ACCESS_TOKEN = 'accessToken';
export const TOKEN_TYPE = 'tokenType';
export const EXPIRES = 'expires';
export const ACCESS_TYPE = 'access_type';
export const STATE = 'state';
export const OTHERS = 'others';

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface IToken {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export class OAuth2Provider extends AOAuthProvider implements IOAuth2Provider {

    public static stateEncode(dto: IOAuth2Dto): string {
        return encode(`${dto.getUser()}:${dto.getApplicationKey()}`, 'base64url');
    }

    public static stateDecode(state: string): { user: string; name: string } {
        const params = decode(state, 'base64url').split(':');

        return { user: params[0] ?? '', name: params[1] ?? '' };
    }

    public authorize(
        dto: OAuth2Dto,
        scopes: string[],
        separator: string = ScopeSeparatorEnum.COMMA,
        customConfig = {},
    ): string {
        let state = '';
        if (dto.isCustomApp()) {
            state = OAuth2Provider.stateEncode(dto);
        }

        const client = this.createClient(dto, customConfig);
        const authUrl = client.authorizeURL({
            redirect_uri: dto.isRedirectUrl() ? dto.getRedirectUrl() : this.getRedirectUri(),
            scope: scopes.join(separator),
            state,
        });
        return `${authUrl}&access_type=offline`;
    }

    public async getAccessToken(
        dto: IOAuth2Dto,
        code: string,
        scopes: string[],
        separator: string = ScopeSeparatorEnum.COMMA,
        customConfig = {},
    ): Promise<IToken> {
        const tokenParams = {
            code,
            redirect_uri: dto.isRedirectUrl() ? dto.getRedirectUrl() : this.getRedirectUri(),
            scope: scopes.join(separator),
        };

        const client = this.createClient(dto, customConfig);

        const accessToken = await client.getToken(tokenParams);
        return OAuth2Provider.convertAccessToken(accessToken);
    }

    public async refreshAccessToken(dto: OAuth2Dto, token: IToken, customConfig = {}): Promise<IToken> {
        if (!Object.hasOwn(token, REFRESH_TOKEN)) {
            OAuth2Provider.throwException('Refresh token not found! Refresh is not possible.', 205);
        }
        const client = this.createClient(dto, customConfig);
        const accessToken = client.createToken({
            access_token: token[ACCESS_TOKEN],
            refresh_token: token[REFRESH_TOKEN],
        });
        const newAccessToken = await accessToken.refresh();

        return OAuth2Provider.convertAccessToken(newAccessToken);
    }

    private static convertAccessToken(accessToken: AccessToken): IToken {
        if (!accessToken?.token?.access_token) {
            throw new Error(`Token is not received or is not valid. Reason: [${accessToken?.token?.error}]`);
        }

        const { access_token, token_type, refresh_token, expires_at, ...others } = accessToken.token;

        const token: Record<string, unknown> = {
            [ACCESS_TOKEN]: access_token,
            [TOKEN_TYPE]: token_type,
            [EXPIRES]: expires_at,
            [OTHERS]: others,
        };

        if (refresh_token) {
            token[REFRESH_TOKEN] = refresh_token;
        }

        return token;
    }

    private createClient(dto: IOAuth2Dto, customConfig = {}): AuthorizationCode {
        const tokenUrl = new URL(dto.getTokenUrl());
        const authUrl = new URL(dto.getAuthorizationUrl());
        const config = {
            client: {
                id: dto.getClientId(),
                secret: dto.getClientSecret(),
            },
            auth: {
                tokenHost: tokenUrl.origin,
                tokenPath: tokenUrl.pathname,
                authorizeHost: authUrl.origin,
                authorizePath: authUrl.pathname,
            },
        };
        return new AuthorizationCode(deepmerge(config, customConfig));
    }

}
