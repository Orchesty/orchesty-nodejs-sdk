import Repository, { IPaging, IQueryFilter, IQuerySorter } from '../../Storage/Mongodb/Repository';
import Webhook from './Webhook';

export interface IWebhookQueryFilter extends IQueryFilter {
    apps?: string[];
    users?: string[];
}

export interface IWebhookQuery {
    sorter?: IQuerySorter;
    paging?: IPaging;
    filter: IWebhookQueryFilter;
}

export default class WebhookRepository extends Repository<Webhook, IWebhookQuery> {

    public fromObject(object: unknown): Webhook {
        const webhook = new Webhook();
        return webhook.fromObject<Webhook>(webhook, object);
    }

}
