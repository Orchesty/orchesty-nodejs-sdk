import { IMetricsSender } from './IMetricsSender';

export const INFLUX = 'influx';
export const MONGO = 'mongo';

export default class MetricsSenderLoader {

    public constructor(
        private readonly metricsService: string,
        private readonly influxSender?: IMetricsSender,
        private readonly mongoSender?: IMetricsSender,
    ) {
    }

    public getSender(): IMetricsSender {
        switch (this.metricsService) {
            case INFLUX:
                if (!this.influxSender) {
                    throw new Error('Influx metrics sender has not been set.');
                }
                return this.influxSender;

            case MONGO:
                if (!this.mongoSender) {
                    throw new Error('Mongo metrics sender has not been set.');
                }
                return this.mongoSender;

            default: {
                const validOpt = [INFLUX, MONGO];
                throw new Error(`Environment [METRICS_SERVICE=${this.metricsService}] is not a valid option. Valid options are: ${validOpt.join(', ')}`);
            }
        }
    }

}
