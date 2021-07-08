import { IMetricsSender } from './IMetricsSender';

export const INFLUX = 'influx';
export const MONGO = 'mongo';

export default class MetricsSenderLoader {
  constructor(
    private _metricsService: string,
    private _influxSender?: IMetricsSender,
    private _mongoSender?: IMetricsSender,
  ) {
  }

  public getSender(): IMetricsSender {
    switch (this._metricsService) {
      case INFLUX:
        if (!this._influxSender) {
          throw new Error('Influx metrics sender has not been set.');
        }
        return this._influxSender;

      case MONGO:
        if (!this._mongoSender) {
          throw new Error('Mongo metrics sender has not been set.');
        }
        return this._mongoSender;

      default: {
        const validOpt = [INFLUX, MONGO];
        // eslint-disable-next-line max-len
        throw new Error(`Environment [METRICS_SERVICE=${this._metricsService}] is not a valid option. Valid options are: ${validOpt.join(', ')}`);
      }
    }
  }
}
