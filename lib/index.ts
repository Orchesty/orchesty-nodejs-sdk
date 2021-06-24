import express from 'express';
import DIContainer from './DIContainer/Container';
import CommonLoader from './Commons/CommonLoader';
import ConnectorRouter from './Connector/ConnectorRouter';
import CommonRouter from './Commons/CommonRouter';
import logger from './Logger/Logger';
import CustomNodeRouter from './CustomNode/CustomNodeRouter';
import {
  appOptions, cryptOptions, pipesOptions, storageOptions,
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

export const routes: CommonRouter[] = [];
const container = new DIContainer();
const expressApp: express.Application = express();
expressApp.use(metricsHandler);

export function initiateContainer(): void {
  // Instantiate core services
  const cryptProviders = [
    new WindWalkerCrypt(cryptOptions.secret),
  ];
  const cryptManager = new CryptManager(cryptProviders);
  const mongoDbClient = new MongoDbClient(storageOptions.dsn, cryptManager);
  const loader = new CommonLoader(container);
  const appManager = new ApplicationManager(mongoDbClient, loader);
  const oauth2Provider = new OAuth2Provider(pipesOptions.backend);
  const curlSender = new CurlSender();

  // Add them to the DIContainer
  container.set(CoreServices.CRYPT_MANAGER, cryptManager);
  container.set(CoreServices.MONGO, mongoDbClient);
  container.set(CoreServices.LOADER, loader);
  container.set(CoreServices.APP_MANAGER, appManager);
  container.set(CoreServices.OAUTH2_PROVIDER, oauth2Provider);
  container.set(CoreServices.CURL, curlSender);

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
    logger.info(`⚡️[server]: Server is running at http://localhost:${appOptions.port}`);
    routes.forEach((router) => {
      logger.info(`⚡️[server]: Router '${router.getName()}' loaded.`);
    });
  });
}

export { expressApp, container };