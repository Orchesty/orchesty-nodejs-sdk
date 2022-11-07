import logger from '../../Logger/Logger';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { IMetricsFields, ITagsMap } from '../Metrics';

export default class Mongo {

    public constructor(private readonly client: MongoDbClient) {
    }

    public async send(measurement: string, fields: IMetricsFields, tags: ITagsMap): Promise<boolean> {
        try {
            const db = await this.client.db();
            await db.collection(measurement).insertOne({ fields, tags });
            return true;
        } catch (e) {
            if (e instanceof Error) {
                logger.error(e.message, {});
            }
            return false;
        }
    }

    public async close(): Promise<boolean> {
        await this.client.down();
        return true;
    }

}
