import { Headers } from 'node-fetch';
import crypto from 'crypto';
import CoreServices from '../../../DIContainer/CoreServices';
import DIContainer from '../../../DIContainer/Container';
import WebhookManager from '../WebhookManager';
import { getTestContainer, mockedFetch } from '../../../../test/TestAbstact';
import TestWebhookApplication from '../../../../test/Application/TestWebhookApplication';
import { ApplicationInstall } from '../../Database/ApplicationInstall';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import { AUTHORIZATION_SETTINGS } from '../../Base/AApplication';
import { PASSWORD, TOKEN, USER } from '../../../Authorization/Type/Basic/ABasicApplication';
import ResponseDto from '../../../Transport/Curl/ResponseDto';

let container: DIContainer;
let webhookManager: WebhookManager;
let appInstall: ApplicationInstall;
let dbClient: MongoDbClient;

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  ctxFromDto: () => jest.fn(),
  ctxFromReq: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Tests for webhookManager', () => {
  beforeAll(async () => {
    container = await getTestContainer();
    dbClient = container.get(CoreServices.MONGO);
  });

  beforeEach(async () => {
    appInstall = new ApplicationInstall();
    appInstall.setUser('user')
      .setName('webhookName')
      .setSettings({
        key: 'value',
        [AUTHORIZATION_SETTINGS]: {
          [USER]: 'user',
          [PASSWORD]: 'password',
          [TOKEN]: 'token',
        },
      });
    const repo = await dbClient.getRepository(ApplicationInstall);
    await repo.insert(appInstall);
    webhookManager = container.get(CoreServices.WEBHOOK_MANAGER);
  });

  afterAll(async () => {
    await dbClient.down();
  });

  it('should get all webhooks', async () => {
    const app = container.getApplication('webhookName') as TestWebhookApplication;
    const webhooks = await webhookManager.getWebhooks(app, appInstall.getUser());
    expect(webhooks).toHaveLength(1);
    expect(webhooks).toStrictEqual([{
      default: true, enabled: false, name: 'testWebhook', topology: 'testWebhook',
    }]);
  });

  it('should subscribe webhooks', async () => {
    jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => 'mockedToken');
    mockedFetch.get(
      'https://sp.orchesty.com/webhook/topologies/testWebhook/nodes/testNode/token/mockedToken',
      new ResponseDto(JSON.stringify({ id: '1' }), 200, new Headers()),
    );
    expect(await webhookManager.subscribeWebhooks(
      appInstall.getName(),
      appInstall.getUser(),
      { name: 'testName', topology: 'testWebhook' },
    ));
  });

  it('should unsubscribe webhooks', async () => {
    mockedFetch.delete(
      '/unknown/url',
      new ResponseDto(JSON.stringify({ id: '1' }), 200, new Headers()),
    );

    expect(await webhookManager.unsubscribeWebhooks(
      appInstall.getName(),
      appInstall.getUser(),
      { name: 'testName', topology: 'testWebhook' },
    ));
  });
});