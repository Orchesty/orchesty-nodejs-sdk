import express from 'express';
import DIContainer from './DIContainer/Container';
import CommonLoader from './Commons/CommonLoader';
import ConnectorRouter from './Connector/ConnectorRouter';
import CommonRouter from './Commons/CommonRouter';
import logger from './Logger/Logger';
import CustomNodeRouter from './CustomNode/CustomNodeRouter';
import { appOptions, cryptOptions, storageOptions } from './Config/Config';
import errorHandler from './Middleware/ErrorHandler';
import metricsHandler from './Middleware/MetricsHandler';
import { ApplicationRouter } from './Application/ApplicationRouter';
import ApplicationManager from './Application/Manager/ApplicationManager';
import CryptManager from './Crypt/CryptManager';
import WindWalkerCrypt from './Crypt/Impl/WindWalkerCrypt';
import MongoDbClient from './Storage/Mongodb/Client';
import CurlSender from './Transport/Curl/CurlSender';

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
  const curlSender = new CurlSender();

  // Add them to the DIContainer
  container.set('hbpf.core.crypt_manager', cryptManager);
  container.set('hbpf.core.mongo', mongoDbClient);
  container.set('hbpf.core.common_loader', loader);
  container.set('hbpf.core.app_manager', appManager);
  container.set('hbpf.core.curl_sender', curlSender);

  // Configure routes
  routes.push(new ConnectorRouter(expressApp, loader));
  routes.push(new CustomNodeRouter(expressApp, loader));
  routes.push(new ApplicationRouter(expressApp, appManager));
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
