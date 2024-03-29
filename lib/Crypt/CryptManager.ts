import { ArbitraryObject, traverse } from 'object-traversal';
import { ICrypt, NAME } from './ICrypt';

export const PREFIX_LENGTH = 4;

export default class CryptManager {

    private providers: Record<string, ICrypt> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(providers: any[] = []) {
        providers.forEach((provider) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            if (typeof provider.getType.bind(provider) === 'function' && provider.getType() === NAME) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                this.providers[provider.getPrefix()] = provider;
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    public encrypt(data: any, prefix?: string): string {
        if (typeof data === 'object') {
            traverse(data, ({ parent, key, value }) => {
                if (parent && key) {
                    this.fixUnsupportedDataTypes(parent, key, value);

                    if (Array.isArray(value)) {
                        value.forEach((arrayVal, i) => {
                            this.fixUnsupportedDataTypes(value, i, arrayVal);
                        });
                    }
                }
            });
        }

        return this.getImplementation(prefix).encrypt(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public decrypt(data: string): any {
        const prefix = data.substring(0, PREFIX_LENGTH);

        return this.getImplementation(prefix).decrypt(data);
    }

    public transfer(encryptedData: string, newCryptProviderPrefix: string): string {
        return this.encrypt(this.decrypt(encryptedData), newCryptProviderPrefix);
    }

    private getImplementation(prefix?: string): ICrypt {
        const pfx = prefix ?? '';
        // Pick first if provider not specified
        const first = Object.values(this.providers).shift();
        if (pfx === '' && first !== undefined) {
            return first;
        }

        // Use selected provider
        if (this.providers[pfx] !== undefined) {
            return this.providers[pfx];
        }

        // BC break
        if (pfx === '00_') {
            throw Error('The prefix was removed for license reasons.');
        }

        throw Error('Unknown crypt service prefix.');
    }

    private fixUnsupportedDataTypes(parent: ArbitraryObject, key: number | string, value: unknown): void {
        if (value === undefined) {
            parent[key] = '';
        }

        if (value instanceof Date) {
            parent[key] = value.toString();
        }
    }

}
