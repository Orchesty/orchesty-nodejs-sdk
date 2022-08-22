import ADocument from '../../Storage/Mongodb/ADocument';

export const USER = 'user';
export const APPLICATION = 'application';

export default class Webhook extends ADocument {

    private name = '';

    private user = '';

    private token = '';

    private node = '';

    private topology = '';

    private application = '';

    private webhookId = '';

    private unsubscribeFailed = false;

    public constructor() {
        super();
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): this {
        this.name = name;
        return this;
    }

    public getUser(): string {
        return this.user;
    }

    public setUser(user: string): this {
        this.user = user;
        return this;
    }

    public getToken(): string {
        return this.token;
    }

    public setToken(token: string): this {
        this.token = token;
        return this;
    }

    public getNode(): string {
        return this.node;
    }

    public setNode(node: string): this {
        this.node = node;
        return this;
    }

    public getTopology(): string {
        return this.topology;
    }

    public setTopology(topology: string): this {
        this.topology = topology;
        return this;
    }

    public getApplication(): string {
        return this.application;
    }

    public setApplication(application: string): this {
        this.application = application;
        return this;
    }

    public getWebhookId(): string {
        return this.webhookId;
    }

    public setWebhookId(webhookId: string): this {
        this.webhookId = webhookId;
        return this;
    }

    public getUnsubscribeFailed(): boolean {
        return this.unsubscribeFailed;
    }

    public setUnsubscribeFailed(unsubscribeFailed: boolean): this {
        this.unsubscribeFailed = unsubscribeFailed;
        return this;
    }

}
