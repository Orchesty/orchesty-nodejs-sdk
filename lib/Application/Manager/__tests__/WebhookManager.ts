import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import TestWebhookApplication from '../../../../test/Application/TestWebhookApplication';
import { dropCollection, getTestContainer } from '../../../../test/TestAbstact';
import { PASSWORD, TOKEN, USER } from '../../../Authorization/Type/Basic/ABasicApplication';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import CoreFormsEnum from '../../Base/CoreFormsEnum';
import { ApplicationInstall } from '../../Database/ApplicationInstall';
import Webhook from '../../Database/Webhook';
import WebhookManager from '../WebhookManager';

let container: DIContainer;
let webhookManager: WebhookManager;
let appInstall: ApplicationInstall;
let dbClient: MongoDbClient;
let mockAdapter: MockAdapter;

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    log: () => jest.fn(),
    ctxFromDto: () => jest.fn(),
    ctxFromReq: () => jest.fn(),
    createCtx: jest.fn().mockImplementation(() => ({})),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Tests for webhookManager', () => {
    beforeAll(async () => {
        mockAdapter = new MockAdapter(axios);
        container = await getTestContainer();
        dbClient = container.get(CoreServices.MONGO);
    });

    beforeEach(async () => {
        appInstall = new ApplicationInstall();
        appInstall
            .setEnabled(true)
            .setUser('user')
            .setName('webhookName')
            .setSettings({
                key: 'value',
                [CoreFormsEnum.AUTHORIZATION_FORM]: {
                    [USER]: 'user',
                    [PASSWORD]: 'password',
                    [TOKEN]: 'token',
                },
            });
        const repo = await dbClient.getApplicationRepository();
        await repo.insert(appInstall);
        webhookManager = container.get(CoreServices.WEBHOOK_MANAGER);
    });

    afterAll(async () => {
        await dbClient.down();
    });

    it('should get all webhooks', async () => {
        await dropCollection(Webhook.getCollection());
        const repo = await dbClient.getRepository(Webhook);
        await repo.insert(new Webhook().setName('testWebhook').setUser('user').setApplication('webhookName').setTopology('testWebhook'));
        const app = container.getApplication('webhookName') as TestWebhookApplication;
        const webhooks = await webhookManager.getWebhooks(app, appInstall.getUser());
        expect(webhooks).toHaveLength(1);
        expect(webhooks).toStrictEqual([{
            default: true, enabled: true, name: 'testWebhook', topology: 'testWebhook',
        }]);
    });

    it('should subscribe webhooks', async () => {
        mockAdapter.onGet(
            /https:\/\/sp.orchesty.com\/webhook\/topologies\/testWebhook\/nodes\/testNode\/token\/.*/,
        ).replyOnce(200, Buffer.from(JSON.stringify({ id: '1' })));
        await expect(webhookManager.subscribeWebhooks(
            appInstall.getName(),
            appInstall.getUser(),
            { name: 'testName', topology: 'testWebhook' },
        )).resolves.not.toThrow();
    });

    it('should unsubscribe webhooks', async () => {
        mockAdapter.onDelete('/unknown/url')
            .reply(200, Buffer.from(JSON.stringify({ id: '1' })));

        await expect(webhookManager.unsubscribeWebhooks(
            appInstall.getName(),
            appInstall.getUser(),
            { name: 'testName', topology: 'testWebhook' },
        )).resolves.not.toThrow();
        mockAdapter.restore();
    });
});
