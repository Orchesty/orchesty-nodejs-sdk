import { ITagsMap, Metrics } from 'metrics-sender/dist/lib/metrics/Metrics';
import { metricsOptions } from '../../Config/Config';
import { parseInfluxDsn } from '../../Utils/DsnParser';
import { IMetricsSender } from '../IMetricsSender';
import { IMetricsFields } from '../Metrics';

export default class Influx implements IMetricsSender {

    public async send(measurement: string, fields: IMetricsFields, tags: ITagsMap): Promise<boolean> {
        try {
            const parsed = parseInfluxDsn(metricsOptions.dsn);
            const client = new Metrics(measurement, tags, parsed.server, parsed.port);
            await client.send(fields);
            client.close();
            return true;
        } catch {
            return false;
        }
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async close(): Promise<boolean> {
        return true;
    }

}
