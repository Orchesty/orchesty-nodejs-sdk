import { ITagsMap } from 'metrics-sender/dist/lib/metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { IMetricsSender } from '../IMetricsSender';
import logger from '../../Logger/Logger';

export default class Mongo implements IMetricsSender {
  constructor(private _client: MongoDbClient) {
  }

  async send(measurement: string, _fields: ITagsMap, tags: ITagsMap): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fields: any = _fields;
      fields.created = parseInt(fields.created, 10);
      const db = await this._client.db();
      await db.collection(measurement).insertOne({ fields, tags });
      return true;
    } catch (e) {
      if (e instanceof Error) logger.error(e.message);
      return false;
    }
  }

  async close(): Promise<boolean> {
    await this._client.down();
    return true;
  }
}
