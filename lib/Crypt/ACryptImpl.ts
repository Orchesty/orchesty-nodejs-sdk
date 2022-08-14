import { ICrypt, NAME } from './ICrypt';
import { PREFIX_LENGTH } from './CryptManager';

abstract class ACryptImpl implements ICrypt {
  public abstract decrypt(data: string): unknown

  public abstract encrypt(data: unknown): string

  protected constructor(protected _prefix: string) {
    if (this.getPrefixLength() !== PREFIX_LENGTH) {
      throw Error(
        // eslint-disable-next-line max-len
        `Crypt prefix of class [${this.constructor.name}] has bad length [${this.getPrefixLength()}], allowed length is ${PREFIX_LENGTH}.`,
      );
    }
  }

  public getType = (): string => NAME;

  public getPrefix(): string {
    return this._prefix;
  }

  public getPrefixLength(): number {
    return this._prefix.length;
  }
}

export default ACryptImpl;
