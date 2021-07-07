import { ITagsMap, Metrics } from 'metrics-sender/dist/lib/metrics/Metrics';
import { IMetricsSender } from '../IMetricsSender';
import { metricsOptions } from '../../Config/Config';

export default class Influx implements IMetricsSender {
  send = async (measurement: string, fields: ITagsMap, tags: ITagsMap): Promise<boolean> => {
    try {
      const client = new Metrics(measurement, tags, metricsOptions.server, metricsOptions.port);
      await client.send(fields);
      return true;
    } catch {
      return false;
    }
  };
}
