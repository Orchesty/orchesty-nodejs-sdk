import crypto from 'crypto';
import { orchestyOptions } from '../../Config/Config';
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

interface IWebhookBody {
    name?: string;
    topology?: string;
}

interface IWebhookForm {
    name: string;
    default: boolean;
    enabled: boolean;
    topology: string;
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

    public async getWebhooks(app: AApplication, user: string): Promise<IWebhookForm[]> {
        const webhooks = await this.getAllWebhooks(app.getName(), user);
        const ret: IWebhookForm[] = [];

        (app as unknown as IWebhookApplication).getWebhookSubscriptions().forEach((subs) => {
            let enabled = false;
            let topology = subs.getTopology();

            const filtered = webhooks.filter((w) => w.getName() === subs.getName());
            if (filtered.length > 0) {
                enabled = true;
                topology = filtered[0]?.getTopology();
            }

            ret.push({
                name: subs.getName(),
                default: subs.getTopology() !== '',
                enabled,
                topology,
            });
        });

        return ret;
    }

    public async subscribeWebhooks(name: string, user: string, data: IWebhookBody): Promise<(Webhook | undefined)[]> {
        this.validateBody(data);

        const app = this.getApplication(name);
        const appInstall = await this.loadApplicationInstall(name, user);

        if (!isWebhook(app.getApplicationType()) || !app.isAuthorized(appInstall)) {
            return [];
        }

        return Promise.all(
            app.getWebhookSubscriptions()
                .map(async (subs) => {
                    if (!subs.getTopology() && data.name !== subs.getName()) {
                        return undefined;
                    }

                    const topology = data.topology ?? subs.getTopology();
                    const token = crypto.randomBytes(LENGTH).toString('hex');
                    const request = app.getWebhookSubscribeRequestDto(
                        appInstall,
                        subs,
                        `${orchestyOptions.startingPoint}/webhook/topologies/${topology}/nodes/${subs.getNode()}/token/${token}`,
                    );

                    const webhookId = app.processWebhookSubscribeResponse(
                        await this.curl.send(request),
                        appInstall,
                    );

                    const webhook = new Webhook();
                    webhook
                        .setName(subs.getName())
                        .setUser(user)
                        .setNode(subs.getNode())
                        .setTopology(topology)
                        .setApplication(app.getName())
                        .setWebhookId(webhookId)
                        .setToken(token);

                    await this.webhookRepository.insert(webhook);

                    return webhook;
                }),
        );
    }

    public async unsubscribeWebhooks(name: string, user: string, data: IWebhookBody): Promise<(Webhook | undefined)[]> {
        this.validateBody(data);

        const app = this.getApplication(name);
        const appInstall = await this.loadApplicationInstall(name, user);

        if (!isWebhook(app.getApplicationType()) || !app.isAuthorized(appInstall)) {
            return [];
        }

        const webhooks = await this.getAllWebhooks(name, user);
        return Promise.all(
            webhooks.map(async (webhook) => {
                if (data.topology !== webhook.getTopology()) {
                    return undefined;
                }

                const request = app.getWebhookUnsubscribeRequestDto(appInstall, webhook);
                const resp = app.processWebhookUnsubscribeResponse(await this.curl.send(request));
                if (resp) {
                    await this.webhookRepository.remove(webhook);
                } else {
                    webhook.setUnsubscribeFailed(true);
                    await this.webhookRepository.update(webhook);
                }

                return webhook;
            }),
        );
    }

    private async getAllWebhooks(application: string, user: string): Promise<Webhook[]> {
        return this.webhookRepository.findMany({ apps: [application], users: [user] });
    }

    private getApplication(key: string): IWebhookApplication {
        return ((this.loader.get(APPLICATION_PREFIX, key)) as unknown) as IWebhookApplication;
    }

    private async loadApplicationInstall(name: string, user: string): Promise<ApplicationInstall> {
        const appInstall = await this.appRepository.findByNameAndUser(name, user, null);
        if (!appInstall) {
            throw Error(`ApplicationInstall with user [${user}] and name [${name}] has not been found!`);
        }

        return appInstall;
    }

    private validateBody(data: IWebhookBody): void {
        if (!data.name && !data.topology) {
            throw new Error('Required parameter [name, topology] not found.');
        }
    }

}
