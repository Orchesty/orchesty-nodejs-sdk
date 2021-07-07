import { ITagsMap } from 'metrics-sender/dist/lib/metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { IMetricsSender } from '../IMetricsSender';
import logger from '../../Logger/Logger';

export default class Mongo implements IMetricsSender {
  constructor(private _client: MongoDbClient) {
  }

  async send(measurement: string, fields: ITagsMap, tags: ITagsMap): Promise<boolean> {
    try {
      const db = await this._client.db();
      await db.collection(measurement)
        .insertOne({
          fields,
          tags,
        });
      return true;
    } catch (e) {
      logger.error(e.message);
      return false;
    }
  }
}
