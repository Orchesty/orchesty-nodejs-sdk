export const metricsOptions = {
    curlMeasurement: 'connectors',
    processMeasurement: 'monolith',
};

export const storageOptions = {
    dsn: process.env.MONGODB_DSN ?? '',
};

export const appOptions = {
    port: parseInt(process.env.APP_PORT ?? '8080', 10),
    debug: process.env.APP_ENV === 'debug' || process.env.NODE_ENV === 'debug',
    env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'debug',
};

export const cryptOptions = {
    secret: process.env.CRYPT_SECRET ?? '',
};

export const orchestyOptions = {
    backend: process.env.BACKEND_URL ?? process.env.BACKEND_DSN ?? '',
    startingPoint: process.env.STARTING_POINT_DSN ?? '',
    workerApi: process.env.WORKER_API_HOST ?? '',
    orchestyApiKey: process.env.ORCHESTY_API_KEY ?? '',
    systemUser: 'orchesty',
};
