export const loggerOptions = {
    logsApi: process.env.LOGS_API ?? '',
};

export const metricsOptions = {
    dsn: process.env.METRICS_DSN ?? '',
    curlMeasurement: process.env.CURL_METRICS_MEASUREMENT ?? 'connectors',
    processMeasurement: process.env.PROCESS_METRICS_MEASUREMENT ?? 'monolith',
};

export const storageOptions = {
    dsn: process.env.MONGODB_DSN ?? '',
};

export const appOptions = {
    port: parseInt(process.env.APP_PORT ?? '8080', 10),
    debug: process.env.APP_ENV === 'debug',
    env: process.env.APP_ENV ?? 'debug',
};

export const cryptOptions = {
    secret: process.env.CRYPT_SECRET ?? '',
};

export const orchestyOptions = {
    backend: process.env.BACKEND_URL ?? process.env.BACKEND_DSN ?? '',
    startingPoint: process.env.STARTING_POINT_DSN ?? '',
    orchestyApiKey: process.env.ORCHESTY_API_KEY ?? '',
    systemUser: 'orchesty',
};
