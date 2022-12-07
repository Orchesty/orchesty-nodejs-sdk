function getUrl(name: string, fallback?: string): string {
    const tenantId = process.env.TENANT_ID;
    if (tenantId) {
        const domain = `${process.env.CLOUD_REGION ?? 'eu1'}.cloud.orchesty.io`;
        switch (name) {
            case 'BACKEND_URL':
                return `https://api-${tenantId}.${domain}`;
            case 'STARTING_POINT_URL':
                return `https://start-${tenantId}.${domain}`;
            case 'WORKER_API_HOST':
                return `https://worker-${tenantId}.${domain}`;
            default:
                throw new Error(`Url for [${name}] is not supported.`);
        }
    }

    return fallback ?? (() => {
        throw new Error(`Env [${name}] is missing.`);
    })();
}

export const metricsOptions = {
    curlMeasurement: 'connectors',
    processMeasurement: 'monolith',
};

export const appOptions = {
    port: parseInt(process.env.APP_PORT ?? '8080', 10),
    debug: process.env.APP_ENV === 'debug' || process.env.NODE_ENV === 'debug',
    env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'debug',
};

export const cryptOptions = {
    secret: process.env.CRYPT_SECRET ?? (() => {
        throw new Error('Env [CRYPT_SECRET] is missing.');
    })(),
};

export const orchestyOptions = {
    backend: getUrl('BACKEND_URL', process.env.BACKEND_URL ?? process.env.BACKEND_DSN),
    startingPoint: getUrl('STARTING_POINT_URL', process.env.STARTING_POINT_URL ?? process.env.STARTING_POINT_DSN),
    workerApi: getUrl('WORKER_API_HOST', process.env.WORKER_API_HOST),
    orchestyApiKey: process.env.ORCHESTY_API_KEY ?? '',
    systemUser: 'orchesty',
};
