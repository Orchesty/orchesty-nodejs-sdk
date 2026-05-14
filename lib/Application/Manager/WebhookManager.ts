import crypto from 'crypto';
import logger from '../../Logger/Logger';
import TopologyRunner from '../../Topology/TopologyRunner';
import CurlSender from '../../Transport/Curl/CurlSender';
import ApplicationLoader from '../ApplicationLoader';
import { APPLICATION_PREFIX } from '../ApplicationRouter';
import AApplication from '../Base/AApplication';
import { isWebhook } from '../Base/ApplicationTypeEnum';
import { IWebhookApplication } from '../Base/IWebhookApplication';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import ApplicationInstallRepository from '../Database/ApplicationInstallRepository';
import Webhook from '../Database/Webhook';
import WebhookRepository from '../Database/WebhookRepository';

export interface IWebhookBody {
    name?: string;
    topology?: string;
    node?: string;
    parameters?: Record<string, string>;
}

interface IWebhookForm {
    name: string;
    default: boolean;
    enabled: boolean;
    topology: string;
    node: string;
    webhookId: string;
    token: string;
}

const LENGTH = 25;

export default class WebhookManager {

    public constructor(
        private readonly loader: ApplicationLoader,
        private readonly curl: CurlSender,
        private readonly webhookRepository: WebhookRepository,
        private readonly appRepository: ApplicationInstallRepository,
    ) {
    }

    public async getWebhooks(app: AApplication, user: string, sdk: string): Promise<IWebhookForm[]> {
        const webhooks = await this.getAllWebhooks(app.getName(), user, sdk);
        const ret: IWebhookForm[] = [];

        (app as unknown as IWebhookApplication).getWebhookSubscriptions().forEach((subs) => {
            const filtered = webhooks.filter((w) => w.getName() === subs.getName());

            if (filtered.length === 0) {
                ret.push({
                    name: subs.getName(),
                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    default: subs.getTopology() !== '',
                    enabled: false,
                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    topology: subs.getTopology(),
                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    node: subs.getNode(),
                    webhookId: '',
                    token: '',
                });
                return;
            }

            filtered.forEach((w) => {
                ret.push({
                    name: subs.getName(),
                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    default: subs.getTopology() !== '',
                    enabled: true,
                    topology: w.getTopology(),
                    node: w.getNode(),
                    webhookId: w.getWebhookId(),
                    token: w.getToken(),
                });
            });
        });

        return ret;
    }

    public async subscribeWebhooks(
        name: string,
        user: string,
        sdk: string,
        data: IWebhookBody,
    ): Promise<(Webhook | undefined)[]> {
        this.validateBody(data);

        const app = this.getApplication(name);
        const appInstall = await this.loadApplicationInstall(name, user, sdk);

        if (!isWebhook(app.getApplicationType()) || !app.isAuthorized(appInstall)) {
            return [];
        }

        return Promise.all(
            app.getWebhookSubscriptions()
                .map(async (subs) => {
                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    if (!subs.getTopology() && data.name !== subs.getName()) {
                        return undefined;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    const topology = data.topology ?? subs.getTopology();
                    // eslint-disable-next-line @typescript-eslint/no-deprecated
                    const node = data.node ?? subs.getNode();

                    if (!topology || !node) {
                        throw new Error(
                            `Cannot subscribe webhook [${subs.getName()}] of application [${name}]: topology and node must be supplied either by WebhookSubscription or via request body.`,
                        );
                    }

                    if (data.parameters) {
                        Object.entries(data.parameters).forEach(([key, value]) => {
                            subs.getParameters()[key] = value;
                        });
                    }

                    const token = crypto.randomBytes(LENGTH).toString('hex');
                    const request = app.getWebhookSubscribeRequestDto(
                        appInstall,
                        subs,
                        TopologyRunner.getWebhookUrl(topology, node, token),
                    );

                    const webhookId = app.processWebhookSubscribeResponse(
                        await this.curl.send(request),
                        appInstall,
                    );

                    const webhook = new Webhook();
                    webhook
                        .setName(subs.getName())
                        .setUser(user)
                        .setSdk(sdk)
                        .setNode(node)
                        .setTopology(topology)
                        .setApplication(app.getName())
                        .setWebhookId(webhookId)
                        .setToken(token);

                    await this.webhookRepository.insert(webhook);

                    return webhook;
                }),
        );
    }

    public async unsubscribeWebhooks(
        name: string,
        user: string,
        sdk: string,
        data: IWebhookBody,
    ): Promise<(Webhook | undefined)[]> {
        this.validateBody(data);

        const app = this.getApplication(name);
        const appInstall = await this.loadApplicationInstall(name, user, sdk);

        if (!isWebhook(app.getApplicationType()) || !app.isAuthorized(appInstall)) {
            return [];
        }

        const webhooks = await this.getAllWebhooks(name, user, sdk);
        return Promise.all(
            webhooks
                .filter((webhook) => this.matchWebhook(webhook, data))
                .map(async (webhook) => {
                    const request = app.getWebhookUnsubscribeRequestDto(appInstall, webhook);
                    const resp = app.processWebhookUnsubscribeResponse(await this.curl.send(request));
                    if (resp) {
                        await this.webhookRepository.remove(webhook);
                    } else {
                        webhook.setUnsubscribeFailed(true);
                        await this.webhookRepository.update(webhook);
                        logger.warn(
                            `[webhook]: Unsubscribe failed for webhook [${webhook.getName()}] (topology=${webhook.getTopology()}, node=${webhook.getNode()}, externalId=${webhook.getWebhookId()})`,
                            {},
                        );
                    }

                    return webhook;
                }),
        );
    }

    private matchWebhook(webhook: Webhook, data: IWebhookBody): boolean {
        if (data.name && webhook.getName() !== data.name) {
            return false;
        }
        if (data.topology && webhook.getTopology() !== data.topology) {
            return false;
        }
        if (data.node && webhook.getNode() !== data.node) {
            return false;
        }
        return true;
    }

    private async getAllWebhooks(application: string, user: string, sdk: string): Promise<Webhook[]> {
        return this.webhookRepository.findMany({ apps: [application], users: [user], sdks: [sdk] });
    }

    private getApplication(key: string): IWebhookApplication {
        return ((this.loader.get(APPLICATION_PREFIX, key)) as unknown) as IWebhookApplication;
    }

    private async loadApplicationInstall(name: string, user: string, sdk: string): Promise<ApplicationInstall> {
        const appInstall = await this.appRepository.findByNameAndUser(name, user, [sdk], null);
        if (!appInstall) {
            throw Error(`ApplicationInstall with user [${user}] and name [${name}] has not been found!`);
        }

        return appInstall;
    }

    private validateBody(data: IWebhookBody): void {
        if (!data.name && !data.topology && !data.node) {
            throw new Error('Required parameter [name, topology, node] not found.');
        }
    }

}
