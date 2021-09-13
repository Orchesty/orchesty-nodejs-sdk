import { ITagsMap } from 'metrics-sender/dist/lib/metrics/Metrics';
import { IMetricsFields } from './Metrics';

export interface IMetricsSender {
  send(measurement: string, fields: IMetricsFields, tags: ITagsMap): Promise<boolean>;
  close(): Promise<boolean>;
}
