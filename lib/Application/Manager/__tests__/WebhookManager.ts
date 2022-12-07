import TestWebhookApplication from '../../../../test/Application/TestWebhookApplication';
import { mockOnce, webhookConfig } from '../../../../test/MockServer';
import { getApplicationWithSettings, getTestContainer, WEBHOOK_NAME } from '../../../../test/TestAbstact';
import { USER } from '../../../Authorization/Type/Basic/ABasicApplication';
import { orchestyOptions } from '../../../Config/Config';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import CurlSender from '../../../Transport/Curl/CurlSender';
import { HttpMethods } from '../../../Transport/HttpMethods';
import ApplicationLoader from '../../ApplicationLoader';
import { ApplicationInstall } from '../../Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Database/ApplicationInstallRepository';
import Webhook from '../../Database/Webhook';
import WebhookRepository from '../../Database/WebhookRepository';
import WebhookManager from '../WebhookManager';

let container: DIContainer;
let webhookManager: WebhookManager;
let webhookRepository: WebhookRepository;
let dbClient: MongoDbClient;

describe('Tests for webhookManager', () => {
    beforeAll(() => {
        container = getTestContainer();
        dbClient = container.get(CoreServices.MONGO);
        const curl = container.get<CurlSender>(CoreServices.CURL);

        const testApp = new TestWebhookApplication();
        const mockedContainer = new DIContainer();
        mockedContainer.setApplication(testApp);

        const appRepo = container.getRepository(ApplicationInstall) as ApplicationInstallRepository;
        webhookRepository = container.getRepository(Webhook);

        const mockedLoader = new ApplicationLoader(mockedContainer);
        webhookManager = new WebhookManager(mockedLoader, curl, webhookRepository, appRepo);
    });

    beforeEach(() => {
        const repo = dbClient.getRepository(Webhook);
        repo.clearCache();
    });

    it('should get all webhooks', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/Webhook?filter={"apps":["${WEBHOOK_NAME}"],"users":["${USER}"]}`,
            },
            response: { body: [webhookConfig] },
        }]);

        const app = container.getApplication(WEBHOOK_NAME) as TestWebhookApplication;
        const webhooks = await webhookManager.getWebhooks(app, USER);
        expect(webhooks).toHaveLength(1);
        expect(webhooks).toStrictEqual([{
            default: true, enabled: true, name: 'testWebhook', topology: 'testWebhook',
        }]);
    });

    it('should subscribe webhooks', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${WEBHOOK_NAME}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, WEBHOOK_NAME)] },
        }]);

        await expect(webhookManager.subscribeWebhooks(
            WEBHOOK_NAME,
            USER,
            { name: 'testName', topology: 'testWebhook' },
        )).resolves.not.toThrow();
    });

    it('should unsubscribe webhooks', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${WEBHOOK_NAME}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, WEBHOOK_NAME)] },
        }]);

        await expect(webhookManager.unsubscribeWebhooks(
            WEBHOOK_NAME,
            USER,
            { name: 'testName', topology: 'testWebhook' },
        )).resolves.not.toThrow();
    });
});
