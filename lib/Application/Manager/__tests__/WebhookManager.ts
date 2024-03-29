import TestWebhookApplication from '../../../../test/Application/TestWebhookApplication';
import { mockOnce, webhookConfig } from '../../../../test/MockServer';
import { getApplicationWithSettings, getTestContainer, WEBHOOK_NAME } from '../../../../test/TestAbstact';
import { USER } from '../../../Authorization/Type/Basic/ABasicApplication';
import { orchestyOptions } from '../../../Config/Config';
import DIContainer from '../../../DIContainer/Container';
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

describe('Tests for webhookManager', () => {
    beforeAll(() => {
        container = getTestContainer();
        const curl = container.get(CurlSender);

        const testApp = new TestWebhookApplication();
        const mockedContainer = new DIContainer();
        mockedContainer.setApplication(testApp);

        const appRepo = container.getRepository(ApplicationInstall) as ApplicationInstallRepository;
        webhookRepository = container.getRepository(Webhook);

        const mockedLoader = new ApplicationLoader(mockedContainer);
        webhookManager = new WebhookManager(mockedLoader, curl, webhookRepository, appRepo);
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
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${WEBHOOK_NAME}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, WEBHOOK_NAME)] },
        }]);
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: /https:\/\/sp.orchesty.com\/webhook\/topologies\/testWebhook\/nodes\/testNode\/token\/*/,
            },
            response: { body: Buffer.from(JSON.stringify({ id: '1' })) },
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
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${WEBHOOK_NAME}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, WEBHOOK_NAME)] },
        }]);
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/Webhook?filter={"apps":["${WEBHOOK_NAME}"],"users":["${USER}"]}`,
            },
            response: { body: [webhookConfig] },
        }]);

        mockOnce([{
            request: {
                method: HttpMethods.DELETE,
                url: 'unknown/url',
            },
            response: { body: Buffer.from(JSON.stringify({ id: '1' })) },
        }]);

        await expect(webhookManager.unsubscribeWebhooks(
            WEBHOOK_NAME,
            USER,
            { name: 'testName', topology: 'testWebhook' },
        )).resolves.not.toThrow();
    });
});
