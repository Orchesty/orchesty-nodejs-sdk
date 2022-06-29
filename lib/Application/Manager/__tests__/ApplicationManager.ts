import { Request } from 'express';
import ApplicationManager from '../ApplicationManager';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import TestBasicApplication from '../../../../test/Application/TestBasicApplication';
import { ApplicationInstall, IApplicationSettings } from '../../Database/ApplicationInstall';
import { getTestContainer } from '../../../../test/TestAbstact';
import CoreServices from '../../../DIContainer/CoreServices';
import { OAuth2Provider } from '../../../Authorization/Provider/OAuth2/OAuth2Provider';
import TestOAuth2Application from '../../../../test/Application/TestOAuth2Application';
import DIContainer from '../../../DIContainer/Container';
import { AUTHORIZATION_FORM } from '../../Base/AApplication';
import { FRONTEND_REDIRECT_URL } from '../../../Authorization/Type/OAuth2/IOAuth2Application';
import ApplicationLoader from '../../ApplicationLoader';
import WebhookManager from '../WebhookManager';
import CurlSender from '../../../Transport/Curl/CurlSender';
import ApplicationInstallRepository from '../../Database/ApplicationInstallRepository';
import Webhook from '../../Database/Webhook';
import WebhookRepository from '../../Database/WebhookRepository';
import { PASSWORD } from '../../../Authorization/Type/Basic/ABasicApplication';
import { IField } from '../../Model/Form/Field';

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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn()
    .mockImplementation(() => ({})),
}));

jest.mock('../../../Authorization/Provider/OAuth2/OAuth2Provider');

describe('ApplicationManager tests', () => {
  // Mock Request/Response of Express
  const mockedRequest = () => ({
    headers: { 'node-id': '123' },
    body: '{"body": "aaa"}',
  });

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
    appInstall.setUser('user')
      .setName('test')
      .setSettings({ key: 'value' });

    const repo = await dbClient.getRepository(ApplicationInstall);
    await repo.insert(appInstall);

    appInstallOAuth = new ApplicationInstall();
    appInstallOAuth
      .setUser('user')
      .setName('oauth2application')
      .setSettings({
        key: 'value',
        [AUTHORIZATION_FORM]: { [FRONTEND_REDIRECT_URL]: 'url' },
      });

    await repo.insert(appInstallOAuth);
  });

  afterEach(async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
          application_type: 'cron',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authorization_type: 'basic',
          description: 'Test description',
          key: 'test',
          logo: null,
          name: 'Test application',
        },
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          application_type: 'cron',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authorization_type: 'oauth2',
          description: 'Test OAuth2 application',
          key: 'oauth2application',
          logo: null,
          name: 'Test OAuth2 Application',
        },
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          application_type: 'webhook',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          authorization_type: 'basic',
          description: 'Test webhook description',
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
      .toEqual(['testSyncMethod', 'testSyncMethodVoid']);
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
    expect(AUTHORIZATION_FORM in (dbInstall.applicationSettings as IApplicationSettings)).toBeTruthy();
    expect('testForm' in (dbInstall.applicationSettings as IApplicationSettings)).toBeTruthy();
  });

  it('saveApplicationPassword', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbInstall = await appManager.saveApplicationPassword(
      'test',
      'user',
      AUTHORIZATION_FORM,
      PASSWORD,
      'passs',
    );
    expect(dbInstall.key).toEqual('test');
    expect(dbInstall.user).toEqual('user');
    expect(AUTHORIZATION_FORM in (dbInstall.applicationSettings as IApplicationSettings)).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldPassword = ((dbInstall as any).applicationSettings[AUTHORIZATION_FORM].fields as IField[])
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
    (oAuth2Provider.getAccessToken as jest.MockedFunction<typeof oAuth2Provider.getAccessToken>).mockResolvedValue({});

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

  it('it should throw an exception when have application not found when save application settings', async () => {
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
