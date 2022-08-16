import CryptManager from '../CryptManager';
import WindWalkerCrypt from '../Impl/WindWalkerCrypt';

const expected = { user: 'user', password: 'password' };
const prov = [
    new WindWalkerCrypt('ADFAF1A6A1SEASCA6FA6C1A26SEV6S6S26S2V6SVV+94S8363SDDV6SDV645'),
    new WindWalkerCrypt('222', '002_'),
];
const man = new CryptManager(prov);

describe('CryptManager tests', () => {
    it('Encrypt/Decrypt with prefix', () => {
        const encrypted = man.encrypt(expected, '002_');
        const decrypted = man.decrypt(encrypted);

        expect(decrypted).toEqual(expected);
    });

    it('Encrypt/Decrypt without prefix', () => {
        const encrypted = man.encrypt(expected);
        const decrypted = man.decrypt(encrypted);

        expect(decrypted).toEqual(expected);
    });

    it('Transfer encrypted data', () => {
        const encrypted1 = man.encrypt(expected);
        const encrypted2 = man.transfer(encrypted1, '002_');
        const decrypted = man.decrypt(encrypted2);

        expect(decrypted).toEqual(expected);
    });

    it('Empty manager', () => {
        try {
            const empty = new CryptManager();
            empty.encrypt('text');
            expect(false).toBeTruthy();
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual('Unknown crypt service prefix.');
            }
        }
    });

    it('Unsupported prefix', () => {
        try {
            man.decrypt('00_');
            expect(false).toBeTruthy();
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual('The prefix was removed for license reasons.');
            }
        }
    });

    it('Unknown prefix', () => {
        try {
            man.decrypt('unknown_');
            expect(false).toBeTruthy();
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual('Unknown crypt service prefix.');
            }
        }
    });

    it('Bad prefix length', () => {
        try {
            const bad = new CryptManager([new WindWalkerCrypt('123', 'bad')]);
            bad.decrypt('');
            expect(false).toBeTruthy();
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message)
                    .toEqual('Crypt prefix of class [WindWalkerCrypt] has bad length [3], allowed length is 4.');
            }
        }
    });

    it('Encrypt/Decrypt more complex data', () => {
        const arr = [];
        arr.push('Some random text');
        // eslint-disable-next-line no-useless-escape
        arr.push('docker://dkr.hanaboso.net/pipes/pipes/php-dev:dev/php /opt/project/pf-bundles/vendor/phpunit/phpunit/phpunit --configuration /opt/project/pf-bundles/phpunit.xml.dist CommonsBundleTests\Unit\Commons\Crypt\CryptServiceProviderTest /opt/project/pf-bundles/tests/Unit/Commons/Crypt/CryptServiceProviderTest.php --teamcity');
        arr.push(['1', '2', 3, ['abc']]);
        arr.push({ true: true, false: false });

        arr.forEach((item) => {
            const encrypted = man.encrypt(item);
            const decrypted = man.decrypt(encrypted);
            expect(decrypted).toEqual(item);
        });
    });

    it('Encrypt/Decrypt dual data encryption', () => {
        // eslint-disable-next-line no-useless-escape
        const str = 'asdf12342~!@#$%^&*()_+{}|:"<>?[]\;,./';
        const encrypted = man.encrypt(str);

        const obj = {
            key: 'val',
            str: encrypted,
        };
        const encryptedObj = man.encrypt(obj);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decryptedObj = man.decrypt(encryptedObj);
        const decrypted = man.decrypt(decryptedObj.str);

        expect(decryptedObj).toEqual(obj);
        expect(decrypted).toEqual(str);
    });
});
