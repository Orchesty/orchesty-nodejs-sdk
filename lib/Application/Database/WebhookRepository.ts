import Repository, { IFilter } from '../../Storage/Mongodb/Repository';
import Webhook from './Webhook';

export interface IWebhookQueryFilter extends IFilter {
    apps?: string[];
    users?: string[];
}

export default class WebhookRepository extends Repository<Webhook, IWebhookQueryFilter> {

    public fromObject(object: unknown): Webhook {
        const webhook = new Webhook();
        return webhook.fromObject<Webhook>(webhook, object);
    }

}
