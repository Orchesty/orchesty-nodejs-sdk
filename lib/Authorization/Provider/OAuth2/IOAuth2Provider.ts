import { IOAuth2Dto } from '../Dto/IOAuth2Dto';
import OAuth2Dto from '../Dto/OAuth2Dto';
import { IOAuthProvider } from '../IOAuthProvider';
import { IToken } from './OAuth2Provider';

export interface IOAuth2Provider extends IOAuthProvider {

  authorize(dto: OAuth2Dto, scopes: string[]): string;

  getAccessToken(
    dto: IOAuth2Dto,
    code: string,
    scopes: string[],
    separator: string,
    customConfig: unknown,
  ): Promise<IToken>;

  refreshAccessToken(dto: OAuth2Dto, token: IToken): IToken;
}
