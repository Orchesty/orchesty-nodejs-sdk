export const NAME = 'ICrypt';

export interface ICrypt {
    getPrefix(): string;

    getPrefixLength(): number;

    encrypt(data: unknown): string;

    decrypt(data: string): unknown;

    getType(): string;
}
