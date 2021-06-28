import { ITagsMap } from 'metrics-sender/dist/lib/metrics/Metrics';

export interface IMetricsSender {
  send(measurement: string, fields: ITagsMap, tags: ITagsMap): Promise<boolean>;
}
