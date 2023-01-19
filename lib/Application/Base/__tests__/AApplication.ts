import TestOAuth2Application from '../../../../test/Application/TestOAuth2Application';
import { OAuth2Provider } from '../../../Authorization/Provider/OAuth2/OAuth2Provider';
import { CLIENT_ID } from '../../../Authorization/Type/OAuth2/IOAuth2Application';
import { ApplicationInstall, IApplicationSettings } from '../../Database/ApplicationInstall';
import CoreFormsEnum from '../CoreFormsEnum';

describe('ApplicationManager tests', () => {
    it('application setting', async () => {
        const oAuth2Provider = new OAuth2Provider('');
        const application = new TestOAuth2Application(oAuth2Provider);
        const appInstall = new ApplicationInstall();
        const appSettings: IApplicationSettings = { testForm: { testValue: true }, [CoreFormsEnum.AUTHORIZATION_FORM]: { [CLIENT_ID]: 'testClientId', testField: 'testValue' } };
        appInstall.setSettings(appSettings);
        await application.saveApplicationForms(appInstall, appSettings);

        expect(appInstall.getSettings()).toEqual({ [CoreFormsEnum.AUTHORIZATION_FORM]: { [CLIENT_ID]: 'testClientId' } });
    });
});
