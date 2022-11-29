import { Buffer } from 'buffer';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import { serialize, unserialize } from 'php-serialize';
import sodium from 'sodium-native';
import ACryptImpl from '../ACryptImpl';

const PBKDF2_SALT_BYTE_SIZE = 32;
const PBKDF2_HASH_BYTE_SIZE = 32;

const SHA256 = 'sha256';
const BASE64 = 'base64';

export default class WindWalkerCrypt extends ACryptImpl {

    private pbkdf2Salt?: Buffer;

    private iv?: Buffer;

    private readonly cache;

    private secureHMACKey = '';

    public constructor(private readonly secretKey: string, prefix = '002_') {
        super(prefix);

        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public encrypt(data: any): string {
        this.derivativeSecureKeys(this.getKey());
        const key = this.getKey();
        const iv = this.getIVKey();
        const salt = this.getPbkdf2Salt();
        const encrypted = WindWalkerCrypt.doEncrypt(Buffer.from(serialize(data)), key, iv);
        const hmac = crypto.createHmac(SHA256, this.secureHMACKey)
            .update(Buffer.concat([salt, iv, encrypted]))
            .digest();

        const res = [
            hmac.toString(BASE64),
            salt.toString(BASE64),
            iv.toString(BASE64),
            encrypted.toString(BASE64),
        ];
        sodium.sodium_memzero(encrypted);
        sodium.sodium_memzero(hmac);
        sodium.sodium_memzero(key);
        sodium.sodium_memzero(iv);

        return `${this.getPrefix()}${res.join(':')}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public decrypt(data: string): any {
        if (!data.startsWith(this.getPrefix())) {
            throw Error('Unknown prefix in hash.');
        }
        let hmac;
        let pbkdf2Salt;
        let ivFromData;
        let encrypted;

        const rawData = data.substring(this.getPrefix().length);
        [hmac, pbkdf2Salt, ivFromData, encrypted] = rawData.split(':');

        hmac = Buffer.from(hmac, BASE64);
        pbkdf2Salt = Buffer.from(pbkdf2Salt, BASE64);
        ivFromData = Buffer.from(ivFromData, BASE64);
        encrypted = Buffer.from(encrypted, BASE64);

        this.derivativeSecureKeys(this.getKey(), pbkdf2Salt);
        const calculatedHmac = crypto.createHmac(SHA256, this.secureHMACKey)
            .update(Buffer.concat([pbkdf2Salt, ivFromData, encrypted]))
            .digest();

        if (!WindWalkerCrypt.equalHashes(calculatedHmac, hmac)) {
            throw Error('HMAC Error: Invalid HMAC.');
        }

        const key = this.getKey();
        const decrypted = WindWalkerCrypt.doDecrypt(encrypted, key, ivFromData);
        sodium.sodium_memzero(hmac);
        sodium.sodium_memzero(pbkdf2Salt);
        sodium.sodium_memzero(calculatedHmac);

        return unserialize(decrypted);
    }

    private static repeatToLength(key: string, length: number): string {
        let newKey = key.repeat(Math.ceil(length / key.length));
        newKey = newKey.substring(0, length);

        return newKey;
    }

    private static strSplit(string: string, length: number): string[] {
        const chunks = [];
        let pos = 0;
        while (pos < string.length) {
            chunks.push(string.slice(pos, pos += length));
        }

        return chunks;
    }

    private static equalHashes(knownHmac: Buffer, userHmac: Buffer): boolean {
        return knownHmac.compare(userHmac) === 0;
    }

    private static doEncrypt(message: Buffer, key: Buffer, iv: Buffer): Buffer {
        const encrypted: Buffer = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES);
        sodium.crypto_secretbox_easy(encrypted, message, iv, key);
        sodium.sodium_memzero(message);

        return encrypted;
    }

    private static doDecrypt(message: Buffer, key: Buffer, iv: Buffer): Buffer {
        const decrypted: Buffer = Buffer.alloc(message.length - sodium.crypto_secretbox_MACBYTES);
        sodium.crypto_secretbox_open_easy(decrypted, message, iv, key);
        sodium.sodium_memzero(message);
        sodium.sodium_memzero(iv);
        sodium.sodium_memzero(key);

        return decrypted;
    }

    private getPbkdf2Salt(): Buffer {
        if (this.pbkdf2Salt === undefined || this.pbkdf2Salt.length < 1) {
            this.pbkdf2Salt = crypto.pseudoRandomBytes(PBKDF2_SALT_BYTE_SIZE);
        }

        return this.pbkdf2Salt;
    }

    private getIVKey(): Buffer {
        if (this.iv === undefined || this.iv.length < 0) {
            this.iv = Buffer.alloc(24);
            sodium.randombytes_buf(this.iv);
        }

        return this.iv;
    }

    private getKey(): Buffer {
        return Buffer.from(WindWalkerCrypt.repeatToLength(this.secretKey, sodium.crypto_secretbox_KEYBYTES));
    }

    private derivativeSecureKeys(key: Buffer, pbkdf2Salt?: Buffer): void {
        let pbkdf2SaltBuff: Buffer;
        if (!pbkdf2Salt) {
            pbkdf2SaltBuff = this.getPbkdf2Salt();
        } else {
            pbkdf2SaltBuff = pbkdf2Salt;
        }

        if (!this.cache.has(`pbkdf2_${key}_${pbkdf2SaltBuff}`)) {
            const pbkdf2 = crypto.pbkdf2Sync(key, pbkdf2SaltBuff, 12000, PBKDF2_HASH_BYTE_SIZE, 'sha256');
            this.cache.set(`pbkdf2_${key}_${pbkdf2SaltBuff}`, pbkdf2);
        }

        const buff = this.cache.get(`pbkdf2_${key}_${pbkdf2SaltBuff}`) as Buffer;
        [, this.secureHMACKey] = WindWalkerCrypt.strSplit(buff.toString('hex'), PBKDF2_HASH_BYTE_SIZE);
    }

}
