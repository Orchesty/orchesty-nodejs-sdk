import { Request } from 'express';
import logger from '../../Logger/Logger';
import RequestDto from '../../Transport/Curl/RequestDto';
import ResponseDto from '../../Transport/Curl/ResponseDto';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import Webhook from '../Database/Webhook';
import WebhookManager, { IWebhookBody } from '../Manager/WebhookManager';
import WebhookSubscription from '../Model/Webhook/WebhookSubscription';
import AApplication from './AApplication';
import ApplicationTypeEnum from './ApplicationTypeEnum';
import { IWebhookApplication } from './IWebhookApplication';

/**
 * Base class for applications that expose webhooks.
 *
 * Subclasses must implement the API specifics (subscribe / unsubscribe request
 * and response handling) plus the {@link getWebhookSubscriptions} catalog of
 * supported events.
 *
 * The lifecycle (when to subscribe / unsubscribe and against which topology
 * & node) is now driven by the UI through the sync actions exposed below —
 * {@link syncSubscribeWebhook}, {@link syncUnsubscribeWebhook}, and
 * {@link syncListWebhookEvents}.
 */
export default abstract class AWebhookApplication extends AApplication implements IWebhookApplication {

    private webhookManager?: WebhookManager;

    public abstract getWebhookSubscriptions(): WebhookSubscription[];

    public abstract getWebhookSubscribeRequestDto(
        applicationInstall: ApplicationInstall,
        subscription: WebhookSubscription,
        url: string,
    ): RequestDto;

    public abstract getWebhookUnsubscribeRequestDto(
        applicationInstall: ApplicationInstall,
        webhook: Webhook,
    ): RequestDto;

    public abstract processWebhookSubscribeResponse(
        dto: ResponseDto,
        applicationInstall: ApplicationInstall,
    ): string;

    public abstract processWebhookUnsubscribeResponse(dto: ResponseDto): boolean;

    public getApplicationType(): ApplicationTypeEnum {
        return ApplicationTypeEnum.WEBHOOK;
    }

    public setWebhookManager(manager: WebhookManager): this {
        this.webhookManager = manager;
        return this;
    }

    /**
     * Returns the catalog of webhook events this application can subscribe to.
     * The UI calls it via the sync action endpoint to build the dropdown of
     * available events when the user configures a Webhook node.
     */
    public syncListWebhookEvents(): {
        name: string;
        parameters: Record<string, string>;
        description: string;
    }[] {
        return this.getWebhookSubscriptions().map((subs) => ({
            name: subs.getName(),
            parameters: subs.getParameters(),
            description: subs.getDescription(),
        }));
    }

    /**
     * Subscribes a single webhook event for the given (topology, node) pair.
     * Expected request body shape: { name, topology, node, parameters? }.
     */
    public async syncSubscribeWebhook(req: Request): Promise<unknown> {
        const manager = this.requireManager();
        const body = this.parseBody(req);
        const { user, sdk } = this.requireUserSdk(body, req);
        const result = await manager.subscribeWebhooks(this.getName(), user, sdk, body);
        return {
            status: 'ok',
            webhooks: result.filter((w) => w).map((w) => w?.toArray()),
        };
    }

    /**
     * Unsubscribes a single webhook event identified by (name, topology, node).
     * Expected request body shape: { name, topology, node }.
     */
    public async syncUnsubscribeWebhook(req: Request): Promise<unknown> {
        const manager = this.requireManager();
        const body = this.parseBody(req);
        const { user, sdk } = this.requireUserSdk(body, req);
        const result = await manager.unsubscribeWebhooks(this.getName(), user, sdk, body);
        return {
            status: 'ok',
            webhooks: result.filter((w) => w).map((w) => w?.toArray()),
        };
    }

    private requireManager(): WebhookManager {
        if (!this.webhookManager) {
            throw new Error(
                `WebhookManager has not been injected into application [${this.getName()}]. Make sure the application was registered via container.setApplication().`,
            );
        }
        return this.webhookManager;
    }

    private parseBody(req: Request): IWebhookBody & { user?: string; sdk?: string } {
        const raw = req.body;
        if (raw === undefined || raw === null) {
            return {};
        }
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch (e) {
                logger.warn(`[webhook]: failed to parse sync action body: ${(e as Error).message}`, {});
                return {};
            }
        }
        return raw as IWebhookBody & { user?: string; sdk?: string };
    }

    private requireUserSdk(
        body: { user?: string; sdk?: string },
        req: Request,
    ): { user: string; sdk: string } {
        const user = body.user ?? (req.query.user as string | undefined);
        const sdk = body.sdk ?? (req.query.sdk as string | undefined);
        if (!user || !sdk) {
            throw new Error('Sync webhook action requires `user` and `sdk` (in body or query).');
        }
        return { user, sdk };
    }

}
