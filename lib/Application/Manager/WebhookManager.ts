import { randomBytes } from 'crypto';
import { isWebhook } from '../Base/ApplicationTypeEnum';
import { IWebhookApplication } from '../Base/IWebhookApplication';
import { pipesOptions } from '../../Config/Config';
import CurlSender from '../../Transport/Curl/CurlSender';
import Webhook from '../Database/Webhook';
import WebhookRepository from '../Database/WebhookRepository';
import ApplicationLoader from '../ApplicationLoader';
import { APPLICATION_PREFIX } from '../ApplicationRouter';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import ApplicationInstallRepository from '../Database/ApplicationInstallRepository';
import AApplication from '../Base/AApplication';

interface IWebhookBody {
  name?: string,
  topology?: string,
}

interface IWebhookForm {
  name: string,
  default: boolean,
  enabled: boolean,
  topology: string
}

const LENGTH = 25;

export default class WebhookManager {
  public constructor(
    private _loader: ApplicationLoader,
    private _curl: CurlSender,
    private _webhookRepository: WebhookRepository<Webhook>,
    private _appRepository: ApplicationInstallRepository<ApplicationInstall>,
  ) {
  }

  public async getWebhooks(app: AApplication, user: string): Promise<IWebhookForm[]> {
    const webhooks = await this._getAllWebhooks(app.getName(), user);
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

  public async subscribeWebhooks(name: string, user: string, data: IWebhookBody): Promise<void> {
    this._validateBody(data);

    const app = this._getApplication(name);
    const appInstall = await this._loadApplicationInstall(name, user);

    if (!isWebhook(app.getApplicationType()) || !app.isAuthorized(appInstall)) {
      return;
    }

    await Promise.all(
      app.getWebhookSubscriptions()
        .map(async (subs) => {
          if (!subs.getTopology() || data.topology !== subs.getName()) {
            return;
          }

          const topology = data.topology ?? subs.getTopology();
          const token = randomBytes(LENGTH)
            .toString('hex');
          const request = app.getWebhookSubscribeRequestDto(
            appInstall,
            subs,
            `${pipesOptions.startingPoint}/webhook/topologies/${topology}/nodes/${subs.getNode()}/token/${token}`,
          );

          const webhookId = app.processWebhookSubscribeResponse(
            await this._curl.send(request),
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

          await this._webhookRepository.upsert(webhook);
        }),
    );
  }

  public async unsubscribeWebhooks(name: string, user: string, data: IWebhookBody): Promise<void> {
    this._validateBody(data);

    const app = this._getApplication(name);
    const appInstall = await this._loadApplicationInstall(name, user);

    if (!isWebhook(app.getApplicationType()) || !app.isAuthorized(appInstall)) {
      return;
    }

    const webhooks = await this._getAllWebhooks(name, user);
    await Promise.all(
      webhooks.map(async (webhook) => {
        if (data.topology !== webhook.getTopology()) {
          return;
        }

        const request = app.getWebhookUnsubscribeRequestDto(appInstall, webhook.getWebhookId());
        const resp = app.processWebhookUnsubscribeResponse(await this._curl.send(request));
        if (resp) {
          await this._webhookRepository.remove(webhook);
        } else {
          webhook.setUnsubscribeFailed(true);
          await this._webhookRepository.update(webhook);
        }
      }),
    );
  }

  private async _getAllWebhooks(application: string, user: string): Promise<Webhook[]> {
    return this._webhookRepository.findMany({ application, user });
  }

  private _getApplication(key: string): IWebhookApplication {
    return ((this._loader.get(APPLICATION_PREFIX, key)) as unknown) as IWebhookApplication;
  }

  private async _loadApplicationInstall(name: string, user: string): Promise<ApplicationInstall> {
    const appInstall = await this._appRepository.findByNameAndUser(name, user);
    if (appInstall === null) {
      throw Error(`ApplicationInstall with user [${user}] and name [${name}] has not found!`);
    }

    return appInstall;
  }

  private _validateBody = (data: IWebhookBody): void => {
    if (!data.name && !data.topology) {
      throw new Error('Required parameter [name, topology] not found.');
    }
  };
}
