import { Request } from 'express';
import ApplicationManager from '../ApplicationManager';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import TestBasicApplication from '../../../../test/Application/TestBasicApplication';
import { ApplicationInstall } from '../../Database/ApplicationInstall';
import { getTestContainer } from '../../../../test/TestAbstact';

let appManager: ApplicationManager;
let dbClient: MongoDbClient;
let appInstall: ApplicationInstall;

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('ApplicationManager tests', () => {
  // Mock Request/Response of Express
  const mockedRequest = () => ({
    headers: { 'pf-node-id': '123' },
    body: '{"body": "aaa"}',
  });

  function mockRequest(): Request {
    return mockedRequest() as unknown as Request;
  }

  beforeEach(async () => {
    const container = getTestContainer();
    appManager = container.get('hbpf.core.app_manager');
    dbClient = container.get('hbpf.core.mongo');
    appInstall = new ApplicationInstall();
    appInstall.setUser('user').setKey('test').setSettings({ key: 'value' });

    const repo = await dbClient.getRepository(ApplicationInstall);
    await repo.insert(appInstall);
  });

  afterEach(async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    await repo.remove(appInstall);
    await dbClient.down();
  });

  it('applications', () => {
    expect(appManager.getApplications()).toEqual(['test']);
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

  xit('authorizationApplication', async () => {
    // TODO: otestovat na OAuth2 Applikaci
    const dbInstall = await appManager.authorizationApplication('test', 'user', 'http://testRedirect.com');
    expect(dbInstall).toEqual('');
  });

  xit('saveAuthorizationToken', async () => {
    // TODO: otestovat na OAuth2 Applikaci
    const dbInstall = await appManager.saveAuthorizationToken('test', 'user', { testToken: 'tokenTest' });
    expect(dbInstall).toEqual('url');
  });
});
