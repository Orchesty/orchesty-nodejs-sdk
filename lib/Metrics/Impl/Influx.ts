import { ITagsMap, Metrics } from 'metrics-sender/dist/lib/metrics/Metrics';
import { IMetricsSender } from '../IMetricsSender';
import { metricsOptions } from '../../Config/Config';

export default class Influx implements IMetricsSender {
  send = async (measurement: string, fields: ITagsMap, tags: ITagsMap): Promise<boolean> => {
    try {
      let server;
      let port;
      // eslint-disable-next-line prefer-const
      [server, port] = metricsOptions.dsn.split(':');
      // TODO: better parsing

      const client = new Metrics(measurement, tags, server, parseInt(port, 10));
      await client.send(fields);
      return true;
    } catch {
      return false;
    }
  };
}
