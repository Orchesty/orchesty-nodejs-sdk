import { PREFIX_LENGTH } from './CryptManager';
import { ICrypt, NAME } from './ICrypt';

abstract class ACryptImpl implements ICrypt {

    protected constructor(protected prefix: string) {
        if (this.getPrefixLength() !== PREFIX_LENGTH) {
            throw Error(
                `Crypt prefix of class [${this.constructor.name}] has bad length [${this.getPrefixLength()}], allowed length is ${PREFIX_LENGTH}.`,
            );
        }
    }

    public abstract decrypt(data: string): unknown;

    public abstract encrypt(data: unknown): string;

    public getType(): string {
        return NAME;
    }

    public getPrefix(): string {
        return this.prefix;
    }

    public getPrefixLength(): number {
        return this.prefix.length;
    }

}

export default ACryptImpl;
