import {
  createHmac,
  pbkdf2Sync,
  pseudoRandomBytes,
} from 'crypto';
import { serialize, unserialize } from 'php-serialize';
import {
  crypto_secretbox_KEYBYTES,
  crypto_secretbox_MACBYTES,
  crypto_secretbox_easy,
  crypto_secretbox_open_easy,
  randombytes_buf,
  sodium_memzero,
} from 'sodium-native';
import { Buffer } from 'buffer';
import NodeCache from 'node-cache';
import ACryptImpl from '../ACryptImpl';

const PBKDF2_SALT_BYTE_SIZE = 32;
const PBKDF2_HASH_BYTE_SIZE = 32;

const SHA256 = 'sha256';
const BASE64 = 'base64';

export default class WindWalkerCrypt extends ACryptImpl {
  private readonly _cache;

  private _secureHMACKey = '';

  private _pbkdf2Salt?: Buffer;

  private _iv?: Buffer;

  public constructor(private readonly _secretKey: string, prefix = '002_') {
    super(prefix);

    this._cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  public encrypt(data: any): string {
    this._derivativeSecureKeys(this._getKey());
    const key = this._getKey();
    const iv = this._getIVKey();
    const salt = this._getPbkdf2Salt();
    const encrypted = WindWalkerCrypt._doEncrypt(Buffer.from(serialize(data)), key, iv);
    const hmac = createHmac(SHA256, this._secureHMACKey)
      .update(Buffer.concat([salt, iv, encrypted]))
      .digest();

    const res = [
      hmac.toString(BASE64),
      salt.toString(BASE64),
      iv.toString(BASE64),
      encrypted.toString(BASE64),
    ];
    sodium_memzero(encrypted);
    sodium_memzero(hmac);
    sodium_memzero(key);
    sodium_memzero(iv);

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

    this._derivativeSecureKeys(this._getKey(), pbkdf2Salt);
    const calculatedHmac = createHmac(SHA256, this._secureHMACKey)
      .update(Buffer.concat([pbkdf2Salt, ivFromData, encrypted]))
      .digest();

    if (!WindWalkerCrypt._equalHashes(calculatedHmac, hmac)) {
      throw Error('HMAC Error: Invalid HMAC.');
    }

    const key = this._getKey();
    const decrypted = WindWalkerCrypt._doDecrypt(encrypted, key, ivFromData);
    sodium_memzero(hmac);
    sodium_memzero(pbkdf2Salt);
    sodium_memzero(calculatedHmac);

    return unserialize(decrypted);
  }

  private _getPbkdf2Salt(): Buffer {
    if (this._pbkdf2Salt === undefined || this._pbkdf2Salt.length < 1) {
      this._pbkdf2Salt = pseudoRandomBytes(PBKDF2_SALT_BYTE_SIZE);
    }

    return this._pbkdf2Salt;
  }

  private _getIVKey(): Buffer {
    if (this._iv === undefined || this._iv.length < 0) {
      this._iv = Buffer.alloc(24);
      randombytes_buf(this._iv);
    }

    return this._iv;
  }

  private _getKey(): Buffer {
    return Buffer.from(WindWalkerCrypt._repeatToLength(this._secretKey, crypto_secretbox_KEYBYTES));
  }

  private _derivativeSecureKeys(key: Buffer, pbkdf2Salt?: Buffer): void {
    let pbkdf2SaltBuff: Buffer;
    if (!pbkdf2Salt) {
      pbkdf2SaltBuff = this._getPbkdf2Salt();
    } else {
      pbkdf2SaltBuff = pbkdf2Salt;
    }

    if (!this._cache.has(`pbkdf2_${key.toString()}_${pbkdf2SaltBuff.toString()}`)) {
      const pbkdf2 = pbkdf2Sync(key, pbkdf2SaltBuff, 12000, PBKDF2_HASH_BYTE_SIZE, 'sha256');
      this._cache.set(`pbkdf2_${key.toString()}_${pbkdf2SaltBuff.toString()}`, pbkdf2);
    }

    const buff = this._cache.get(`pbkdf2_${key.toString()}_${pbkdf2SaltBuff.toString()}`) as Buffer;
    [, this._secureHMACKey] = WindWalkerCrypt._strSplit(buff.toString('hex'), PBKDF2_HASH_BYTE_SIZE);
  }

  private static _repeatToLength(key: string, length: number): string {
    let newKey = key.repeat(Math.ceil(length / key.length));
    newKey = newKey.substring(0, length);

    return newKey;
  }

  private static _strSplit(string: string, length: number): string[] {
    const chunks = [];
    let pos = 0;
    while (pos < string.length) {
      chunks.push(string.slice(pos, pos += length));
    }

    return chunks;
  }

  private static _equalHashes(knownHmac: Buffer, userHmac: Buffer): boolean {
    return knownHmac.compare(userHmac) === 0;
  }

  private static _doEncrypt(message: Buffer, key: Buffer, iv: Buffer): Buffer {
    const encrypted: Buffer = Buffer.alloc(message.length + crypto_secretbox_MACBYTES);
    crypto_secretbox_easy(encrypted, message, iv, key);
    sodium_memzero(message);

    return encrypted;
  }

  private static _doDecrypt(message: Buffer, key: Buffer, iv: Buffer): Buffer {
    const decrypted: Buffer = Buffer.alloc(message.length - crypto_secretbox_MACBYTES);
    crypto_secretbox_open_easy(decrypted, message, iv, key);
    sodium_memzero(message);
    sodium_memzero(iv);
    sodium_memzero(key);

    return decrypted;
  }
}
