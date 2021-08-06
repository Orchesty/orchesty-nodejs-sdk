import { ITagsMap, Metrics } from 'metrics-sender/dist/lib/metrics/Metrics';
import { IMetricsSender } from '../IMetricsSender';
import { metricsOptions } from '../../Config/Config';
import { parseInfluxDsn } from '../../Utils/DsnParser';

export default class Influx implements IMetricsSender {
  send = async (measurement: string, fields: ITagsMap, tags: ITagsMap): Promise<boolean> => {
    try {
      const parsed = parseInfluxDsn(metricsOptions.dsn);
      const client = new Metrics(measurement, tags, parsed.server, parsed.port);
      await client.send(fields);
      client.close();
      return true;
    } catch {
      return false;
    }
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  close = async (): Promise<boolean> => true;
}
