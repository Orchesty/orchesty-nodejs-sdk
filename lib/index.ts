import express from 'express';
import promMiddleware from 'express-prometheus-middleware';
import ApplicationLoader from './Application/ApplicationLoader';
import { ApplicationRouter } from './Application/ApplicationRouter';
import { ApplicationInstall } from './Application/Database/ApplicationInstall';
import ApplicationInstallRepository from './Application/Database/ApplicationInstallRepository';
import Webhook from './Application/Database/Webhook';
import WebhookRepository from './Application/Database/WebhookRepository';
import ApplicationManager from './Application/Manager/ApplicationManager';
import WebhookManager from './Application/Manager/WebhookManager';
import { WebhookRouter } from './Application/WebhookRouter';
import { OAuth2Provider } from './Authorization/Provider/OAuth2/OAuth2Provider';
import BatchRouter from './Batch/BatchRouter';
import ACommonRouter from './Commons/ACommonRouter';
import CommonLoader from './Commons/CommonLoader';
import { appOptions, cryptOptions, metricsOptions, pipesOptions, storageOptions } from './Config/Config';
import ConnectorRouter from './Connector/ConnectorRouter';
import CryptManager from './Crypt/CryptManager';
import WindWalkerCrypt from './Crypt/Impl/WindWalkerCrypt';
import CustomNodeRouter from './CustomNode/CustomNodeRouter';
import DIContainer from './DIContainer/Container';
import CoreServices from './DIContainer/CoreServices';
import logger from './Logger/Logger';
import Influx from './Metrics/Impl/Influx';
import Mongo from './Metrics/Impl/Mongo';
import Metrics from './Metrics/Metrics';
import MetricsSenderLoader from './Metrics/MetricsSenderLoader';
import bodyParser from './Middleware/BodyParseHandler';
import errorHandler from './Middleware/ErrorHandler';
import metricsHandler from './Middleware/MetricsHandler';
import MongoDbClient from './Storage/Mongodb/Client';
import Node from './Storage/Mongodb/Document/Node';
import NodeRepository from './Storage/Mongodb/Document/NodeRepository';
import TopologyRunner from './Topology/TopologyRunner';
import CurlSender from './Transport/Curl/CurlSender';

export const routes: ACommonRouter[] = [];
const container = new DIContainer();
const expressApp: express.Application = express();

expressApp.use(metricsHandler);
expressApp.use(bodyParser);
expressApp.use(promMiddleware({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
}));

export async function initiateContainer(): Promise<void> {
    // Instantiate core services
    const cryptProviders = [
        new WindWalkerCrypt(cryptOptions.secret),
    ];
    const cryptManager = new CryptManager(cryptProviders);
    const mongoDbClient = new MongoDbClient(storageOptions.dsn, cryptManager, container);
    const loader = new CommonLoader(container);
    const appLoader = new ApplicationLoader(container);
    const oauth2Provider = new OAuth2Provider(pipesOptions.backend);
    const metricsLoader = new MetricsSenderLoader(
        metricsOptions.metricsService,
        new Influx(),
        new Mongo(new MongoDbClient(metricsOptions.dsn, cryptManager, container)),
    );
    const metrics = new Metrics(metricsLoader);
    const curlSender = new CurlSender(metrics);
    const topologyRunner = new TopologyRunner(curlSender);

    await mongoDbClient.reconnect();
    const applicationInstallRepo = new ApplicationInstallRepository(
        ApplicationInstall,
        mongoDbClient.getClient(),
        ApplicationInstall.getCollection(),
        cryptManager,
    );

    const webhookRepository = new WebhookRepository(
        Webhook,
        mongoDbClient.getClient(),
        Webhook.getCollection(),
        cryptManager,
    );
    const nodeRepository = new NodeRepository(Node, mongoDbClient.getClient(), Node.getCollection(), cryptManager);

    const webhookManager = new WebhookManager(appLoader, curlSender, webhookRepository, applicationInstallRepo);
    const appManager = new ApplicationManager(applicationInstallRepo, appLoader, webhookManager);

    // Add them to the DIContainer
    container.set(CoreServices.CRYPT_MANAGER, cryptManager);
    container.set(CoreServices.MONGO, mongoDbClient);
    container.set(CoreServices.LOADER, loader);
    container.set(CoreServices.APP_LOADER, appLoader);
    container.set(CoreServices.APP_MANAGER, appManager);
    container.set(CoreServices.WEBHOOK_MANAGER, webhookManager);
    container.set(CoreServices.OAUTH2_PROVIDER, oauth2Provider);
    container.set(CoreServices.CURL, curlSender);
    container.set(CoreServices.METRICS, metrics);
    container.set(CoreServices.TOPOLOGY_RUNNER, topologyRunner);

    container.setRepository(applicationInstallRepo);
    container.setRepository(webhookRepository);
    container.setRepository(nodeRepository);

    // Configure routes
    routes.push(new ApplicationRouter(expressApp, appManager));
    routes.push(new BatchRouter(expressApp, loader));
    routes.push(new ConnectorRouter(expressApp, loader));
    routes.push(new CustomNodeRouter(expressApp, loader));
    routes.push(new WebhookRouter(expressApp, webhookManager));
}

export function listen(): void {
    expressApp.disable('x-powered-by');
    expressApp.use(errorHandler(container.getRepository(Node)));
    expressApp.listen(appOptions.port, () => {
        logger.info(`⚡️[server]: Server is running at http://localhost:${appOptions.port}`, {});
        routes.forEach((router) => {
            logger.info(`⚡️[server]: Router '${router.getName()}' loaded.`, {});
        });
    });
}

export { container, expressApp };
