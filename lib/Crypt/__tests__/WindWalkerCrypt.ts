import { crypto_secretbox_MACBYTES, crypto_secretbox_NONCEBYTES } from 'sodium-native';
import WindWalkerCrypt from '../Impl/WindWalkerCrypt';

const expected = { user: 'data' };
const crypt = new WindWalkerCrypt('123scycycxvxvdvse5678IDLNJNCSKJfefefefeffJKkjbkjbkjnsl');

describe('Crypt tests', () => {
    it('Constants', () => {
        expect(crypto_secretbox_NONCEBYTES).toEqual(24);
        expect(crypto_secretbox_MACBYTES).toEqual(16);
    });

    it('Encrypt/Decrypt', () => {
        crypt.encrypt(expected);
        const encrypted = crypt.encrypt(expected);
        const decrypted = crypt.decrypt(encrypted);

        expect(decrypted).toEqual(expected);
    });

    it('Decrypt unknown test', () => {
        try {
            crypt.decrypt('_unknown');
            expect(false).toBeTruthy();
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual('Unknown prefix in hash.');
            }
        }
    });

    it('Invalid HMAC', () => {
        try {
            let encrypted = crypt.encrypt(expected);
            encrypted = encrypted.substring(crypt.getPrefixLength() + 2);

            crypt.decrypt(`${crypt.getPrefix()}${encrypted}`);
            expect(false).toBeTruthy();
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual('HMAC Error: Invalid HMAC.');
            }
        }
    });

    it('Decrypt string from PHP', () => {
        const phpCrypt = new WindWalkerCrypt('ADFAF1A6A1SEASCA6FA6C1A26SEV6S6S26S2V6SVV+94S8363SDDV6SDV645');

        const php = '002_Cww5KOU6QJOs1UaKXPmxJNEmk4HS6jBs85VSGjis30k=:UIJEGDZf7wFSudwi7lq36AeiiSB4g5vzmeRYXKsd1bM=:MTtg0gS+2PsDOsFc6VuJuU0rKTjXIk1S:sAhh2siZDXLysLmcjPix1Iv5EMstzIqpEu79K4euqj6qmzbckk2l5TAhpwD7HGtsMWtEezBlQdK+Ptz51cLvCMNTQAQxlBimDBd1+PPsPso9Ldh0zSmBbq1kJJeqyNWq0oDwEDawbmCMv0itRxq/vlwGiypcCGY6gsQ+EuDld6SBZ6RezKUI7lZMBxJhz4MkLAQGwKg0aFdoCsjyjNZZRil6aMinokzKW9KLOuo1EaqnwLTPMl1E0oQXgtnwQiX3B5neFxml7RKHAV9BfWOQBVSHoZuK7t0WoZKfrsuElo7c8r0p2IwKlZByR+bPktpgtirUdG90Uw/KbPut1vUFqdPKK72lsEli35nMjUj18cM=';
        const decryptedObj = phpCrypt.decrypt(php);
        expect(decryptedObj).toHaveProperty('key', 'val');
        expect(decryptedObj).toHaveProperty('str');

        const decryptedStr = phpCrypt.decrypt(decryptedObj.str);
        expect(decryptedStr).toEqual('asdf12342~!@#$%^&*()_+{}|:"<>?[]\\;,./');
    });
});
