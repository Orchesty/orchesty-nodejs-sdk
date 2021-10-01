import ADocument from '../../Storage/Mongodb/ADocument';

export const USER = 'user';
export const APPLICATION = 'application';

export default class Webhook extends ADocument {
  /* eslint-disable @typescript-eslint/naming-convention */
  private name = '';

  private user = '';

  private token = '';

  private node = '';

  private topology = '';

  private application = '';

  private webhookId = '';

  private unsubscribeFailed = false;
  /* eslint-enable @typescript-eslint/naming-convention */

  public constructor() {
    super();
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): Webhook {
    this.name = name;
    return this;
  }

  public getUser(): string {
    return this.user;
  }

  public setUser(user: string): Webhook {
    this.user = user;
    return this;
  }

  public getToken(): string {
    return this.token;
  }

  public setToken(token: string): Webhook {
    this.token = token;
    return this;
  }

  public getNode(): string {
    return this.node;
  }

  public setNode(node: string): Webhook {
    this.node = node;
    return this;
  }

  public getTopology(): string {
    return this.topology;
  }

  public setTopology(topology: string): Webhook {
    this.topology = topology;
    return this;
  }

  public getApplication(): string {
    return this.application;
  }

  public setApplication(application: string): Webhook {
    this.application = application;
    return this;
  }

  public getWebhookId(): string {
    return this.webhookId;
  }

  public setWebhookId(webhookId: string): Webhook {
    this.webhookId = webhookId;
    return this;
  }

  public getUnsubscribeFailed(): boolean {
    return this.unsubscribeFailed;
  }

  public setUnsubscribeFailed(unsubscribeFailed: boolean): Webhook {
    this.unsubscribeFailed = unsubscribeFailed;
    return this;
  }
}
