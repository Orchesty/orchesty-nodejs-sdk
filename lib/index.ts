import express from 'express';
import express_prom_bundle from 'express-prom-bundle';
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
import { appOptions, cryptOptions, orchestyOptions } from './Config/Config';
import ConnectorRouter from './Connector/ConnectorRouter';
import CryptManager from './Crypt/CryptManager';
import WindWalkerCrypt from './Crypt/Impl/WindWalkerCrypt';
import CustomNodeRouter from './CustomNode/CustomNodeRouter';
import DIContainer from './DIContainer/Container';
import logger from './Logger/Logger';
import Metrics from './Metrics/Metrics';
import bodyParser from './Middleware/BodyParseHandler';
import errorHandler from './Middleware/ErrorHandler';
import metricsHandler from './Middleware/MetricsHandler';
import DatabaseClient from './Storage/Database/Client';
import Node from './Storage/Database/Document/Node';
import NodeRepository from './Storage/Database/Document/NodeRepository';
import TopologyRunner from './Topology/TopologyRunner';
import CurlSender from './Transport/Curl/CurlSender';

const routes: ACommonRouter[] = [];
const container = new DIContainer();
const expressApp: express.Application = express();

expressApp.use(metricsHandler);
expressApp.use(bodyParser);
expressApp.use(express_prom_bundle({
    metricsPath: '/metrics',
    buckets: [0.1, 0.5, 1, 1.5, 512, 1024, 5120, 10240, 51200, 102400],
    promClient: {
        collectDefaultMetrics: {
        } },
}));

function initiateContainer(): void {
    // Instantiate core services
    const cryptProviders = [
        new WindWalkerCrypt(cryptOptions.secret),
    ];
    const cryptManager = new CryptManager(cryptProviders);
    const databaseClient = new DatabaseClient(container);
    const loader = new CommonLoader(container);
    const appLoader = new ApplicationLoader(container);
    const oauth2Provider = new OAuth2Provider(orchestyOptions.backend);
    const metrics = new Metrics();
    const curlSender = new CurlSender(metrics);
    const topologyRunner = new TopologyRunner(curlSender);

    const applicationInstallRepo = new ApplicationInstallRepository(
        ApplicationInstall,
        databaseClient,
        cryptManager,
    );

    const webhookRepository = new WebhookRepository(
        Webhook,
        databaseClient,
    );
    const nodeRepository = new NodeRepository(
        Node,
        databaseClient,
    );

    const webhookManager = new WebhookManager(appLoader, curlSender, webhookRepository, applicationInstallRepo);
    const appManager = new ApplicationManager(appLoader, applicationInstallRepo, webhookManager);

    // Add them to the DIContainer
    container.set(cryptManager);
    container.set(databaseClient);
    container.set(loader);
    container.set(appLoader);
    container.set(appManager);
    container.set(webhookManager);
    container.set(oauth2Provider);
    container.set(curlSender);
    container.set(metrics);
    container.set(topologyRunner);

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

function listen(): void {
    expressApp.disable('x-powered-by');
    expressApp.use(errorHandler(container.getRepository(Node)));
    expressApp.listen(appOptions.port, () => {
        logger.info(`⚡️[server]: Server is running at http://localhost:${appOptions.port}`, {});
        routes.forEach((router) => {
            logger.info(`⚡️[server]: Router '${router.getName()}' loaded.`, {});
        });
    });
}

export { container, expressApp, initiateContainer, listen, routes };
