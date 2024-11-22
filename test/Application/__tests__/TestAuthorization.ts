import CoreFormsEnum from '../../../lib/Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import { PASSWORD, TOKEN, USER } from '../../../lib/Authorization/Type/Basic/ABasicApplication';
import TestBasicApplication from '../TestBasicApplication';
import TestTokenBasicApplication from '../TestTokenBasicApplication';

describe('Application authorize tests', () => {
    it('isAuthorized', async () => {
        const basicApp = new TestBasicApplication();
        const appInstall = new ApplicationInstall();
        const settings = { [CoreFormsEnum.AUTHORIZATION_FORM]: { [USER]: 'Jakub', [PASSWORD]: 'pass' } };
        await basicApp.saveApplicationForms(appInstall, settings);

        expect(basicApp.isAuthorized(appInstall)).toEqual(true);
    });

    it('isNotAuthorized', () => {
        const basicApp = new TestBasicApplication();
        const appInstall = new ApplicationInstall();
        appInstall.addSettings({ [CoreFormsEnum.AUTHORIZATION_FORM]: [] });

        expect(basicApp.isAuthorized(appInstall)).toEqual(false);
    });

    it('setApplicationToken', async () => {
        const basicApp = new TestTokenBasicApplication();
        const appInstall = new ApplicationInstall();
        const settings = { [CoreFormsEnum.AUTHORIZATION_FORM]: { [TOKEN]: 'token' } };
        await basicApp.saveApplicationForms(appInstall, settings);

        expect(basicApp.isAuthorized(appInstall)).toEqual(true);
    });

    it('setApplicationSettings', async () => {
        const basicApp = new TestBasicApplication();
        const appInstall = new ApplicationInstall();
        const sett = {
            [CoreFormsEnum.AUTHORIZATION_FORM]: { [USER]: 'Jakub', [PASSWORD]: 'pass' },
        };
        const sett1 = {
            testForm: { host: 'Jakub', database: 'pass' },
        };
        await basicApp.saveApplicationForms(appInstall, sett);
        await basicApp.saveApplicationForms(appInstall, sett1);

        expect(basicApp.isAuthorized(appInstall)).toEqual(true);
    });
});
