import { Request } from 'express';
import TestBasicApplication from '../../../../test/Application/TestBasicApplication';
import TestOAuth2Application from '../../../../test/Application/TestOAuth2Application';
import { getTestContainer } from '../../../../test/TestAbstact';
import { OAuth2Provider } from '../../../Authorization/Provider/OAuth2/OAuth2Provider';
import { PASSWORD } from '../../../Authorization/Type/Basic/ABasicApplication';
import { FRONTEND_REDIRECT_URL } from '../../../Authorization/Type/OAuth2/IOAuth2Application';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import CurlSender from '../../../Transport/Curl/CurlSender';
import ApplicationLoader from '../../ApplicationLoader';
import CoreFormsEnum from '../../Base/CoreFormsEnum';
import { ApplicationInstall, IApplicationSettings } from '../../Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Database/ApplicationInstallRepository';
import Webhook from '../../Database/Webhook';
import WebhookRepository from '../../Database/WebhookRepository';
import { IField } from '../../Model/Form/Field';
import ApplicationManager from '../ApplicationManager';
import WebhookManager from '../WebhookManager';

let container: DIContainer;
let appManager: ApplicationManager;
let dbClient: MongoDbClient;
let curl: CurlSender;
let appInstall: ApplicationInstall;
let appInstallOAuth: ApplicationInstall;

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    Logger: jest.fn()
        .mockImplementation(() => ({})),
}));

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

    beforeAll(async () => {
        container = await getTestContainer();
        dbClient = container.get(CoreServices.MONGO);
        curl = container.get(CoreServices.CURL);
        const db = await dbClient.db();
        try {
            await db.dropCollection(ApplicationInstall.getCollection());
        } catch (e) {
            // Ignore non-existent
        }
    });

    beforeEach(async () => {
        appManager = container.get(CoreServices.APP_MANAGER);
        appInstall = new ApplicationInstall();
        appInstall
            .setEnabled(true)
            .setUser('user')
            .setName('test')
            .setSettings({ key: 'value' });

        const repo = await dbClient.getApplicationRepository();
        await repo.insert(appInstall);

        appInstallOAuth = new ApplicationInstall();
        appInstallOAuth
            .setEnabled(true)
            .setUser('user')
            .setName('oauth2application')
            .setSettings({
                key: 'value',
                [CoreFormsEnum.AUTHORIZATION_FORM]: { [FRONTEND_REDIRECT_URL]: 'url' },
            });

        await repo.insert(appInstallOAuth);
    });

    afterEach(async () => {
        const repo = await dbClient.getApplicationRepository();
        await repo.remove(appInstall);
        await repo.remove(appInstallOAuth);
    });

    afterAll(async () => {
        await dbClient.down();
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
        expect(appManager.getApplication('test'))
            .toBeInstanceOf(TestBasicApplication);
    });

    it('getSynchronousActions', () => {
        expect(appManager.getSynchronousActions('test'))
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
            'test',
            'testSyncMethod',
            mockRequest(),
        ))
            .toEqual('{"param1":"p1","param2":"p2"}');
    });

    it('runSynchronousAction with void', async () => {
        expect(await appManager.runSynchronousAction(
            'test',
            'testSyncMethodVoid',
            mockRequest(),
        ))
            .toEqual({ status: 'ok' });
    });

    it('saveApplicationSettings', async () => {
        const appSettings = {
            param1: 'p1',
        };
        const dbInstall = await appManager.saveApplicationSettings('test', 'user', appSettings);

        expect(dbInstall).toHaveProperty('id');
        expect(dbInstall).toHaveProperty('applicationSettings');
        expect(
            CoreFormsEnum.AUTHORIZATION_FORM in (dbInstall.applicationSettings as IApplicationSettings),
        ).toBeTruthy();
        expect('testForm' in (dbInstall.applicationSettings as IApplicationSettings)).toBeTruthy();
    });

    it('saveApplicationPassword', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbInstall = await appManager.saveApplicationPassword(
            'test',
            'user',
            CoreFormsEnum.AUTHORIZATION_FORM,
            PASSWORD,
            'passs',
        );
        expect(dbInstall.key).toEqual('test');
        expect(dbInstall.user).toEqual('user');
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
        const oAuth2Provider = new OAuth2Provider('');
        (oAuth2Provider.authorize as jest.MockedFunction<typeof oAuth2Provider.authorize>).mockReturnValueOnce('https://example.com/authorize?response_type=code&client_id=aa&redirect_uri=http&scope=idoklad_api%2Coffline_access&state=s&access_type=offline');

        const testApp = new TestOAuth2Application(oAuth2Provider);
        const mockedContainer = new DIContainer();
        mockedContainer.setApplication(testApp);

        const appRepo = container.getRepository(ApplicationInstall) as ApplicationInstallRepository<ApplicationInstall>;
        const webhookRepository = container.getRepository(Webhook) as WebhookRepository<Webhook>;

        const mockedLoader = new ApplicationLoader(mockedContainer);
        const webhookManager = new WebhookManager(mockedLoader, curl, webhookRepository, appRepo);
        const mockedAppManager = new ApplicationManager(appRepo, mockedLoader, webhookManager);

        const dbInstall = await mockedAppManager.authorizationApplication('oauth2application', 'user', 'https://example.com');
        expect(dbInstall)
            .toEqual('https://example.com/authorize?response_type=code&client_id=aa&redirect_uri=http&scope=idoklad_api%2Coffline_access&state=s&access_type=offline');
    });

    it('saveAuthorizationToken', async () => {
        const oAuth2Provider = new OAuth2Provider('');
        (oAuth2Provider.getAccessToken as jest.MockedFunction<typeof oAuth2Provider.getAccessToken>)
            .mockResolvedValue({});

        const testApp = new TestOAuth2Application(oAuth2Provider);
        const mockedContainer = new DIContainer();
        mockedContainer.setApplication(testApp);

        const appRepo = container.getRepository(ApplicationInstall) as ApplicationInstallRepository<ApplicationInstall>;
        const webhookRepository = container.getRepository(Webhook) as WebhookRepository<Webhook>;

        const mockedLoader = new ApplicationLoader(mockedContainer);
        const webhookManager = new WebhookManager(mockedLoader, curl, webhookRepository, appRepo);
        const mockedAppManager = new ApplicationManager(appRepo, mockedLoader, webhookManager);
        const frontendUrl = await mockedAppManager.saveAuthorizationToken(
            'oauth2application',
            'user',
            { testToken: 'tokenTest' },
        );
        expect(frontendUrl)
            .toEqual('url');
    });

    it('should throw an exception when have application not found when save application settings', async () => {
        const appSettings = {
            param1: 'p1',
        };
        const applicationName = 'testNotFound';
        try {
            await appManager.saveApplicationSettings(applicationName, 'user', appSettings);
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message)
                    .toEqual(`Service with name [hbpf.application.${applicationName}] does not exist!`);
            }
        }
    });
});
