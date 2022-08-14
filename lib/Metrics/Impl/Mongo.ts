import { ITagsMap } from 'metrics-sender/dist/lib/metrics/Metrics';
import logger from '../../Logger/Logger';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { IMetricsSender } from '../IMetricsSender';
import { IMetricsFields } from '../Metrics';

export default class Mongo implements IMetricsSender {
  public constructor(private readonly _client: MongoDbClient) {
  }

  public async send(measurement: string, fields: IMetricsFields, tags: ITagsMap): Promise<boolean> {
    try {
      const db = await this._client.db();
      await db.collection(measurement).insertOne({ fields, tags });
      return true;
    } catch (e) {
      if (e instanceof Error) logger.error(e.message, {});
      return false;
    }
  }

  public async close(): Promise<boolean> {
    await this._client.down();
    return true;
  }
}
