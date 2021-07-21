import { MONGO } from '../Metrics/MetricsSenderLoader';

export const loggerOptions = {
  dsn: process.env.UDP_LOGGER_DSN || '',
};

export const metricsOptions = {
  dsn: process.env.METRICS_DSN || '',
  curlMeasurement: process.env.CURL_METRICS_MEASUREMENT || 'monolith',
  processMeasurement: process.env.PROCESS_METRICS_MEASUREMENT || 'connectors',
  metricsService: process.env.METRICS_SERVICE || MONGO,
};

export const storageOptions = {
  dsn: process.env.MONGO_DSN || '',
};

export const appOptions = {
  port: parseInt(process.env.APP_PORT || '8080', 10),
  debug: (process.env.APP_ENV === 'debug'),
  env: process.env.APP_ENV || 'debug',
};

export const cryptOptions = {
  secret: process.env.CRYPT_SECRET || '',
};

export const pipesOptions = {
  backend: process.env.BACKEND_URL || '',
  startingPoint: process.env.STARTING_POINT_URL || '',
};
