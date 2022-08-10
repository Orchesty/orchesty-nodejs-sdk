import { IToken } from './OAuth2Provider';
import { IOAuthProvider } from '../IOAuthProvider';
import OAuth2Dto from '../Dto/OAuth2Dto';
import { IOAuth2Dto } from '../Dto/IOAuth2Dto';

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
