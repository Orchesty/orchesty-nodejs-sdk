import TestOAuth2Application from '../../../test/Application/TestOAuth2Application';
import { getTestContainer } from '../../../test/TestAbstact';
import CoreFormsEnum from '../../Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import { ACCESS_TOKEN, EXPIRES, OAuth2Provider, REFRESH_TOKEN } from '../Provider/OAuth2/OAuth2Provider';
import { TOKEN } from '../Type/Basic/ABasicApplication';
import { CLIENT_ID } from '../Type/OAuth2/IOAuth2Application';

describe('Test AOAuth2Application', () => {
    jest.createMockFromModule('simple-oauth2');
    let container: DIContainer;
    let oAuthApplication: TestOAuth2Application;

    beforeAll(() => {
        container = getTestContainer();
        oAuthApplication = new TestOAuth2Application(container.get(CoreServices.OAUTH2_PROVIDER));
    });

    it('should get authorizationType', () => {
        const type = 'oauth2';
        const applicationType = oAuthApplication.getAuthorizationType();
        expect(type).toBe(applicationType);
    });

    it('should check if application authorized and has access token', () => {
        const appInstall = new ApplicationInstall()
            .setUser('user')
            .setName(oAuthApplication.getName());
        const settings = {
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [TOKEN]: {
                    [ACCESS_TOKEN]: 'token',
                },
            },
        };
        appInstall.setSettings(settings);
        const isAuthorized = oAuthApplication.isAuthorized(appInstall);
        expect(isAuthorized).toBeTruthy();
    });

    it('should check if application is not authorized and doesn\'t has access token', () => {
        const appInstall = new ApplicationInstall()
            .setUser('user')
            .setName(oAuthApplication.getName());
        const settings = {
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [TOKEN]: '',
            },
        };
        appInstall.setSettings(settings);
        const isAuthorized = oAuthApplication.isAuthorized(appInstall);
        expect(isAuthorized).toBeFalsy();
    });

    it('should get application form data', async () => {
        const keysToBeReturned = ['client_id', 'client_secret', 'redirect_url'];
        const appInstall = new ApplicationInstall()
            .setUser('user')
            .setName(oAuthApplication.getName());
        const data = await oAuthApplication.getApplicationForms(appInstall);

        keysToBeReturned.forEach((item) => {
            expect(data[CoreFormsEnum.AUTHORIZATION_FORM].fields.find((field) => field.key === item)).toBeDefined();
        });
    });

    it('should refresh authorization token', async () => {
        const provider = container.get<OAuth2Provider>(CoreServices.OAUTH2_PROVIDER);
        Reflect.set(provider, 'createClient', () => ({
            createToken: () => ({
                token: {
                    ok: true, access_token: 'some_token', token_type: '', refresh_token: '123', expires_at: '',
                },
                refresh: () => ({
                    token: {
                        ok: true, access_token: 'some_token', token_type: '', refresh_token: '123', expires_at: '',
                    },
                }),
            }),
        }));

        const appInstall = new ApplicationInstall()
            .setUser('user')
            .setName(oAuthApplication.getName());
        const settings = {
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [CLIENT_ID]: '12',
                [TOKEN]: { [REFRESH_TOKEN]: '123', [ACCESS_TOKEN]: 'some_token', [EXPIRES]: '', others: { ok: true }, tokenType: '' },
            },
        };
        appInstall.setSettings(settings);

        const data = await oAuthApplication.refreshAuthorization(appInstall);
        const returnedSettings = data.getSettings();
        expect(
            returnedSettings[CoreFormsEnum.AUTHORIZATION_FORM][CLIENT_ID],
        ).toEqual(settings[CoreFormsEnum.AUTHORIZATION_FORM][CLIENT_ID]);
        expect(
            returnedSettings[CoreFormsEnum.AUTHORIZATION_FORM][TOKEN],
        ).toEqual(settings[CoreFormsEnum.AUTHORIZATION_FORM][TOKEN]);
    });

    it('should get access token', () => {
        const appInstall = new ApplicationInstall()
            .setUser('user')
            .setName(oAuthApplication.getName());
        const accessToken = 'token';
        const settings = {
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [TOKEN]: {
                    [ACCESS_TOKEN]: accessToken,
                },
            },
        };
        appInstall.setSettings(settings);
        const accessTokenFromService = oAuthApplication.getAccessToken(appInstall);
        expect(accessToken).toEqual(accessTokenFromService);
    });

    it('should set application settings', async () => {
        const appInstall = new ApplicationInstall();
        appInstall.addSettings({ [CoreFormsEnum.AUTHORIZATION_FORM]: [] });
        appInstall.addSettings({ form: [] });
        const sett = { user: 'Jakub', password: 'pass', token: 'token' };
        expect(await oAuthApplication.saveApplicationForms(appInstall, sett)).toBeInstanceOf(ApplicationInstall);
    });

    it('should get token', () => {
        const appInstall = new ApplicationInstall();
        const token = 'token';
        appInstall.addSettings({ [CoreFormsEnum.AUTHORIZATION_FORM]: { [TOKEN]: token } });
        appInstall.addSettings({ form: [] });
        const tokenFromService = oAuthApplication.getTokens(appInstall);
        expect(token).toEqual(tokenFromService);
    });

    it('should throw error when try to get access token and access token is not found', () => {
        const appInstall = new ApplicationInstall();
        appInstall.addSettings({ [CoreFormsEnum.AUTHORIZATION_FORM]: { [TOKEN]: {} } });
        try {
            oAuthApplication.getAccessToken(appInstall);
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual('There is no access token');
            }
        }
    });
});
