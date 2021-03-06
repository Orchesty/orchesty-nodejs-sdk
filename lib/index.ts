import express from 'express';
import DIContainer from './DIContainer/Container';
import CommonLoader from './Commons/CommonLoader';
import ConnectorRouter from './Connector/ConnectorRouter';
import ACommonRouter from './Commons/ACommonRouter';
import logger from './Logger/Logger';
import CustomNodeRouter from './CustomNode/CustomNodeRouter';
import {
  appOptions, cryptOptions, metricsOptions, pipesOptions, storageOptions,
} from './Config/Config';
import errorHandler from './Middleware/ErrorHandler';
import metricsHandler from './Middleware/MetricsHandler';
import { ApplicationRouter } from './Application/ApplicationRouter';
import ApplicationManager from './Application/Manager/ApplicationManager';
import CryptManager from './Crypt/CryptManager';
import WindWalkerCrypt from './Crypt/Impl/WindWalkerCrypt';
import MongoDbClient from './Storage/Mongodb/Client';
import { OAuth2Provider } from './Authorization/Provider/OAuth2/OAuth2Provider';
import CurlSender from './Transport/Curl/CurlSender';
import BatchRouter from './Batch/BatchRouter';
import CoreServices from './DIContainer/CoreServices';
import Metrics from './Metrics/Metrics';
import MetricsSenderLoader from './Metrics/MetricsSenderLoader';
import Mongo from './Metrics/Impl/Mongo';
import Influx from './Metrics/Impl/Influx';
import bodyParser from './Middleware/BodyParseHandler';
import TopologyRunner from './Topology/TopologyRunner';
import ApplicationLoader from './Application/ApplicationLoader';
import ApplicationInstallRepository from './Application/Database/ApplicationInstallRepository';
import { ApplicationInstall } from './Application/Database/ApplicationInstall';

export const routes: ACommonRouter[] = [];
const container = new DIContainer();
const expressApp: express.Application = express();

expressApp.use(metricsHandler);
expressApp.use(bodyParser);

export async function initiateContainer(): Promise<void> {
  // Instantiate core services
  const cryptProviders = [
    new WindWalkerCrypt(cryptOptions.secret),
  ];
  const cryptManager = new CryptManager(cryptProviders);
  const mongoDbClient = new MongoDbClient(storageOptions.dsn, cryptManager, container);
  const loader = new CommonLoader(container);
  const appLoader = new ApplicationLoader(container);
  const appManager = new ApplicationManager(mongoDbClient, appLoader);
  const oauth2Provider = new OAuth2Provider(pipesOptions.backend);
  const metricsLoader = new MetricsSenderLoader(
    metricsOptions.metricsService,
    new Influx(),
    new Mongo(new MongoDbClient(metricsOptions.dsn, cryptManager, container)),
  );
  const metrics = new Metrics(metricsLoader);
  const curlSender = new CurlSender(metrics);
  const topologyRunner = new TopologyRunner(curlSender);

  // Add them to the DIContainer
  container.set(CoreServices.CRYPT_MANAGER, cryptManager);
  container.set(CoreServices.MONGO, mongoDbClient);
  container.set(CoreServices.LOADER, loader);
  container.set(CoreServices.APP_LOADER, appLoader);
  container.set(CoreServices.APP_MANAGER, appManager);
  container.set(CoreServices.OAUTH2_PROVIDER, oauth2Provider);
  container.set(CoreServices.CURL, curlSender);
  container.set(CoreServices.METRICS, metrics);
  container.set(CoreServices.TOPOLOGY_RUNNER, topologyRunner);

  await mongoDbClient.reconnect();
  const applicationInstallRepo = new ApplicationInstallRepository(
    ApplicationInstall,
    mongoDbClient.client,
    ApplicationInstall.getCollection(),
    cryptManager,
  );
  container.setRepository(applicationInstallRepo);

  // Configure routes
  routes.push(new ConnectorRouter(expressApp, loader));
  routes.push(new CustomNodeRouter(expressApp, loader));
  routes.push(new ApplicationRouter(expressApp, appManager));
  routes.push(new BatchRouter(expressApp, loader));
}

export function listen(): void {
  expressApp.disable('x-powered-by');
  expressApp.use(errorHandler);
  expressApp.listen(appOptions.port, () => {
    logger.info(`??????[server]: Server is running at http://localhost:${appOptions.port}`);
    routes.forEach((router) => {
      logger.info(`??????[server]: Router '${router.getName()}' loaded.`);
    });
  });
}

export { expressApp, container };
