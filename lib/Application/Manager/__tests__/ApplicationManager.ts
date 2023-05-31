import { Request } from 'express';
import TestBasicApplication from '../../../../test/Application/TestBasicApplication';
import TestOAuth2Application from '../../../../test/Application/TestOAuth2Application';
import { mockOnce } from '../../../../test/MockServer';
import { getApplicationWithSettings, getTestContainer, USER } from '../../../../test/TestAbstact';
import { OAuth2Provider } from '../../../Authorization/Provider/OAuth2/OAuth2Provider';
import { PASSWORD } from '../../../Authorization/Type/Basic/ABasicApplication';
import { FRONTEND_REDIRECT_URL } from '../../../Authorization/Type/OAuth2/IOAuth2Application';
import { orchestyOptions } from '../../../Config/Config';
import DIContainer from '../../../DIContainer/Container';
import CurlSender from '../../../Transport/Curl/CurlSender';
import { HttpMethods } from '../../../Transport/HttpMethods';
import ApplicationLoader from '../../ApplicationLoader';
import CoreFormsEnum from '../../Base/CoreFormsEnum';
import { ApplicationInstall, IApplicationSettings } from '../../Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Database/ApplicationInstallRepository';
import Webhook from '../../Database/Webhook';
import { IField } from '../../Model/Form/Field';
import ApplicationManager from '../ApplicationManager';
import WebhookManager from '../WebhookManager';

let container: DIContainer;
let appManager: ApplicationManager;
let curl: CurlSender;
const testName = 'test';
const testOAuth2Name = 'oauth2application';

jest.mock('../../../Authorization/Provider/OAuth2/OAuth2Provider');

describe('ApplicationManager tests', () => {
    // Mock Request/Response of Express
    function mockedRequest(): { body: string; headers: Record<string, string> } {
        return {
            headers: { 'node-id': '123' },
            body: '{"body": "aaa"}',
        };
    }

    function mockRequest(): Request {
        return mockedRequest() as unknown as Request;
    }

    function getMockedAppManager(oAuth2Provider: OAuth2Provider): ApplicationManager {
        const testApp = new TestOAuth2Application(oAuth2Provider);
        const mockedContainer = new DIContainer();
        mockedContainer.setApplication(testApp);

        const appRepo = container.getRepository(ApplicationInstall) as ApplicationInstallRepository;
        const webhookRepository = container.getRepository(Webhook);

        const mockedLoader = new ApplicationLoader(mockedContainer);
        const webhookManager = new WebhookManager(mockedLoader, curl, webhookRepository, appRepo);

        return new ApplicationManager(mockedLoader, appRepo, webhookManager);
    }

    beforeAll(() => {
        container = getTestContainer();
        curl = container.get(CurlSender);
        appManager = container.get(ApplicationManager);
    });

    beforeEach(() => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${testName}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, testName)] },
        }]);
    });

    it('applications', () => {
        expect(appManager.getApplications())
            .toEqual([
                {
                    application_type: 'cron',
                    authorization_type: 'basic',
                    description: 'Test description',
                    info: '',
                    isInstallable: true,
                    key: 'test',
                    logo: null,
                    name: 'Test application',
                },
                {
                    application_type: 'cron',
                    authorization_type: 'oauth2',
                    description: 'Test OAuth2 application',
                    info: '',
                    isInstallable: true,
                    key: 'oauth2application',
                    logo: null,
                    name: 'Test OAuth2 Application',
                },
                {
                    application_type: 'webhook',
                    authorization_type: 'basic',
                    description: 'Test webhook description',
                    info: '',
                    isInstallable: false,
                    key: 'webhookName',
                    logo: null,
                    name: 'Test webhook application',
                },
            ]);
    });

    it('getApplication', () => {
        expect(appManager.getApplication(testName))
            .toBeInstanceOf(TestBasicApplication);
    });

    it('getSynchronousActions', () => {
        expect(appManager.getSynchronousActions(testName))
            .toEqual([
                'testSyncMethod',
                'testSyncMethodVoid',
                'afterDisableCallback',
                'afterEnableCallback',
                'afterInstallCallback',
                'afterUninstallCallback',
            ]);
    });

    it('runSynchronousAction', async () => {
        expect(await appManager.runSynchronousAction(
            testName,
            'testSyncMethod',
            mockRequest(),
        ))
            .toEqual('{"param1":"p1","param2":"p2"}');
    });

    it('runSynchronousAction with void', async () => {
        expect(await appManager.runSynchronousAction(
            testName,
            'testSyncMethodVoid',
            mockRequest(),
        )).toEqual({ status: 'ok' });
    });

    it('saveApplicationSettings', async () => {
        const appSettings = {
            testForm: {
                param1: 'p1',
                multi: ['p1', 'b', 'a'],
            },
        };
        const dbInstall = await appManager.saveApplicationSettings(testName, USER, appSettings);

        expect(dbInstall).toHaveProperty('id');
        expect(dbInstall).toHaveProperty('applicationSettings');
        expect(
            CoreFormsEnum.AUTHORIZATION_FORM in (dbInstall.applicationSettings as IApplicationSettings),
        ).toBeTruthy();
        expect('testForm' in (dbInstall.applicationSettings as IApplicationSettings)).toBeTruthy();
    });

    it('saveApplicationPassword', async () => {
        const dbInstall = await appManager.saveApplicationPassword(
            testName,
            USER,
            CoreFormsEnum.AUTHORIZATION_FORM,
            PASSWORD,
            'passs',
        );
        expect(dbInstall.key).toEqual(testName);
        expect(dbInstall.user).toEqual(USER);
        expect(
            CoreFormsEnum.AUTHORIZATION_FORM in (dbInstall.applicationSettings as IApplicationSettings),
        ).toBeTruthy();
        const fieldPassword = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dbInstall as any).applicationSettings[CoreFormsEnum.AUTHORIZATION_FORM].fields as IField[]
        )
            .find((field) => field.key);
        expect(fieldPassword).toBeTruthy();
    });

    it('authorizationApplication', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${testOAuth2Name}"]}`,
            },
            response: { body: [getApplicationWithSettings(
                { [CoreFormsEnum.AUTHORIZATION_FORM]: { [FRONTEND_REDIRECT_URL]: 'url' } },
                testOAuth2Name,
            )] },
        }]);

        const oAuth2Provider = new OAuth2Provider('');
        (oAuth2Provider.authorize as jest.MockedFunction<typeof oAuth2Provider.authorize>).mockReturnValueOnce('https://example.com/authorize?response_type=code&client_id=aa&redirect_uri=http&scope=idoklad_api%2Coffline_access&state=s&access_type=offline');

        const mockedAppManager = getMockedAppManager(oAuth2Provider);
        const dbInstall = await mockedAppManager.authorizationApplication(testOAuth2Name, USER, 'https://example.com');
        expect(dbInstall)
            .toEqual('https://example.com/authorize?response_type=code&client_id=aa&redirect_uri=http&scope=idoklad_api%2Coffline_access&state=s&access_type=offline');
    });

    it('saveAuthorizationToken', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${testOAuth2Name}"]}`,
            },
            response: { body: [getApplicationWithSettings(
                { [CoreFormsEnum.AUTHORIZATION_FORM]: { [FRONTEND_REDIRECT_URL]: 'url' } },
                testOAuth2Name,
            )] },
        }]);

        const oAuth2Provider = new OAuth2Provider('');
        (oAuth2Provider.getAccessToken as jest.MockedFunction<typeof oAuth2Provider.getAccessToken>)
            .mockResolvedValue({});

        const mockedAppManager = getMockedAppManager(oAuth2Provider);
        const frontendUrl = await mockedAppManager.saveAuthorizationToken(
            testOAuth2Name,
            USER,
            { testToken: 'tokenTest' },
        );
        expect(frontendUrl).toEqual('url');
    });

    it('should throw an exception when have application not found when save application settings', async () => {
        const appSettings = {
            param1: 'p1',
        };
        const applicationName = 'testNotFound';
        try {
            await appManager.saveApplicationSettings(applicationName, USER, appSettings);
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message)
                    .toEqual(`Service with name [hbpf.application.${applicationName}] does not exist!`);
            }
        }
    });
});
