import { ICrypt, NAME } from './ICrypt';

export const PREFIX_LENGTH = 4;

export default class CryptManager {
  private _providers: Record<string, ICrypt> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(providers: any[] = []) {
    providers.forEach((provider) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (typeof provider.getType === 'function' && provider.getType() === NAME) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this._providers[provider.getPrefix()] = provider;
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  public encrypt(data: any, prefix?: string): string {
    return this._getImplementation(prefix).encrypt(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public decrypt(data: string): any {
    const prefix = data.substring(0, PREFIX_LENGTH);

    return this._getImplementation(prefix).decrypt(data);
  }

  public transfer(encryptedData: string, newCryptProviderPrefix: string): string {
    return this.encrypt(this.decrypt(encryptedData), newCryptProviderPrefix);
  }

  private _getImplementation(prefix?: string): ICrypt {
    const pfx = prefix ?? '';
    // Pick first if provider not specified
    const first = Object.values(this._providers).shift();
    if (pfx === '' && first !== undefined) {
      return first;
    }

    // Use selected provider
    if (this._providers[pfx] !== undefined) {
      return this._providers[pfx];
    }

    // BC break
    if (pfx === '00_') {
      throw Error('The prefix was removed for license reasons.');
    }

    throw Error('Unknown crypt service prefix.');
  }
}
