import { DateTime } from 'luxon';
import DateTimeUtils, { DATE_TIME } from '../../../Utils/DateTimeUtils';
import { ApplicationInstall } from '../ApplicationInstall';

describe('ApplicationInstall tests', () => {
    const appInstall = new ApplicationInstall();

    it('get encryptedSettings', () => {
        expect(appInstall.getEncryptedSettings()).toEqual('');
    });

    it('get nonEncryptedSettings', () => {
        expect(appInstall.getNonEncryptedSettings()).toEqual({});
    });

    it('get id', () => {
        expect(appInstall.getId()).toEqual('');
    });

    it('get object id', () => {
        try {
            appInstall.getObjectId();
        } catch (e) {
            expect(e).toEqual(Error('_id is not set.'));
        }
    });

    it('get deleted', () => {
        expect(appInstall.getDeleted()).toEqual(false);
    });

    it('get user', () => {
        expect(appInstall.getUser()).toEqual('');
    });

    it('get expires', () => {
        expect(appInstall.getExpires()).toEqual(undefined);
    });

    it('get key', () => {
        expect(appInstall.getName()).toEqual('');
    });

    it('get toArray', () => {
        const expected = {
            created: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(appInstall.getCreated()), DATE_TIME),
            expires: null,
            id: '',
            key: '',
            nonEncryptedSettings: {},
            update: DateTimeUtils.getFormattedDate(DateTime.fromJSDate(appInstall.getUpdated()), DATE_TIME),
            user: '',
        };
        expect(appInstall.toArray()).toEqual(expected);
    });

    it('addNonEncryptedSettings', () => {
        const sett = { sett: 'ings' };
        appInstall.addNonEncryptedSettings(sett);
        expect(appInstall.getNonEncryptedSettings()).toEqual(sett);
    });

    it('setSettings', () => {
        const sett = { sett: 'ings' };
        appInstall.setSettings(sett);
        expect(appInstall.getSettings()).toEqual(sett);
    });

    it('setNonEncryptedSettings', () => {
        const sett = { sett: 'ings' };
        appInstall.setNonEncryptedSettings(sett);
        expect(appInstall.getNonEncryptedSettings()).toEqual(sett);
    });

    it('setEncryptedSettings', () => {
        const sett = 'hash123';
        appInstall.setEncryptedSettings(sett);
        expect(appInstall.getEncryptedSettings()).toEqual(sett);
    });

    it('setExpires', () => {
        const date = DateTimeUtils.utcDate;
        appInstall.setExpires(date);
        expect(appInstall.getExpires()).toEqual(date);
    });
});
