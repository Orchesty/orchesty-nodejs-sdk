import { IToken } from './OAuth2Provider';
import { IOAuthProvider } from '../IOAuthProvider';
import OAuth2Dto from '../Dto/OAuth2Dto';

export interface IOAuth2Provider extends IOAuthProvider {

  authorize(dto: OAuth2Dto, scopes: string[]): string;

  getAccessToken(dto: OAuth2Dto, code: string): IToken;

  refreshAccessToken(dto: OAuth2Dto, token: IToken): IToken;
}
