import { Request } from 'express';
import ApplicationManager from '../ApplicationManager';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import TestBasicApplication from '../../../../test/Application/TestBasicApplication';
import { ApplicationInstall } from '../../Database/ApplicationInstall';
import { getTestContainer } from '../../../../test/TestAbstact';
import CoreServices from '../../../DIContainer/CoreServices';
import { OAuth2Provider } from '../../../Authorization/Provider/OAuth2/OAuth2Provider';
import TestOAuth2Application from '../../../../test/Application/TestOAuth2Application';
import DIContainer from '../../../DIContainer/Container';
import CommonLoader from '../../../Commons/CommonLoader';
import { AUTHORIZATION_SETTINGS } from '../../Base/ApplicationAbstract';
import { FRONTEND_REDIRECT_URL } from '../../../Authorization/Type/OAuth2/IOAuth2Application';

let appManager: ApplicationManager;
let dbClient: MongoDbClient;
let appInstall: ApplicationInstall;
let appInstallOAuth: ApplicationInstall;

const container = getTestContainer();

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../Authorization/Provider/OAuth2/OAuth2Provider');

describe('ApplicationManager tests', () => {
  // Mock Request/Response of Express
  const mockedRequest = () => ({
    headers: { 'pf-node-id': '123' },
    body: '{"body": "aaa"}',
  });

  function mockRequest(): Request {
    return mockedRequest() as unknown as Request;
  }

  beforeAll(async () => {
    dbClient = container.get(CoreServices.MONGO);
    const db = await dbClient.db();
    await db.dropCollection(ApplicationInstall.getCollection());
  });

  beforeEach(async () => {
    appManager = container.get(CoreServices.APP_MANAGER);
    appInstall = new ApplicationInstall();
    appInstall.setUser('user').setKey('test').setSettings({ key: 'value' });

    const repo = await dbClient.getRepository(ApplicationInstall);
    await repo.insert(appInstall);

    appInstallOAuth = new ApplicationInstall();
    appInstallOAuth
      .setUser('user')
      .setKey('oauth2application')
      .setSettings({ key: 'value', [AUTHORIZATION_SETTINGS]: { [FRONTEND_REDIRECT_URL]: 'url' } });

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
    expect(appManager.getApplications()).toEqual(['test', 'oauth2application']);
  });

  it('getApplication', () => {
    expect(appManager.getApplication('test')).toBeInstanceOf(TestBasicApplication);
  });

  it('getSynchronousActions', () => {
    expect(appManager.getSynchronousActions('test')).toEqual(['testSyncMethod']);
  });

  it('runSynchronousAction', () => {
    expect(appManager.runSynchronousAction('test', 'testSyncMethod',
      mockRequest())).toEqual('{"param1":"p1","param2":"p2"}');
  });

  it('saveApplicationSettings', async () => {
    const appSettings = {
      param1: 'p1',
    };
    const dbInstall = await appManager.saveApplicationSettings('test', 'user', appSettings);

    expect(dbInstall.getId() !== '').toBeTruthy();
    expect(dbInstall.getSettings()).toEqual({ key: 'value' });
  });

  it('saveApplicationPassword', async () => {
    const dbInstall = await appManager.saveApplicationPassword('test', 'user', 'passs');
    // eslint-disable-next-line @typescript-eslint/naming-convention
    expect(dbInstall.getSettings()).toEqual({ key: 'value', authorization_settings: { password: 'passs' } });
  });

  it('authorizationApplication', async () => {
    const oAuth2Provider = new OAuth2Provider('');
    (oAuth2Provider.authorize as jest.MockedFunction<typeof oAuth2Provider.authorize>).mockReturnValueOnce('https://example.com/authorize?response_type=code&client_id=aa&redirect_uri=http&scope=idoklad_api%2Coffline_access&state=s&access_type=offline');

    const testApp = new TestOAuth2Application(oAuth2Provider);
    const mockedContainer = new DIContainer();
    mockedContainer.setApplication(testApp);

    const mockedLoader = new CommonLoader(mockedContainer);
    const mockedAppManager = new ApplicationManager(dbClient, mockedLoader);

    const dbInstall = await mockedAppManager.authorizationApplication('oauth2application', 'user', 'https://example.com');
    expect(dbInstall).toEqual('https://example.com/authorize?response_type=code&client_id=aa&redirect_uri=http&scope=idoklad_api%2Coffline_access&state=s&access_type=offline');
  });

  it('saveAuthorizationToken', async () => {
    const oAuth2Provider = new OAuth2Provider('');
    (oAuth2Provider.getAccessToken as jest.MockedFunction<typeof oAuth2Provider.getAccessToken>).mockResolvedValue({});

    const testApp = new TestOAuth2Application(oAuth2Provider);
    const mockedContainer = new DIContainer();
    mockedContainer.setApplication(testApp);

    const mockedLoader = new CommonLoader(mockedContainer);
    const mockedAppManager = new ApplicationManager(dbClient, mockedLoader);
    const frontendUrl = await mockedAppManager.saveAuthorizationToken(
      'oauth2application',
      'user',
      { testToken: 'tokenTest' },
    );
    expect(frontendUrl).toEqual('url');
  });
});
