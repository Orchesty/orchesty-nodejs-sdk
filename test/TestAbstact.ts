import DIContainer from '../lib/DIContainer/Container';
import CurlSender from '../lib/Transport/Curl/CurlSender';
import WindWalkerCrypt from '../lib/Crypt/Impl/WindWalkerCrypt';
import { cryptOptions, storageOptions } from '../lib/Config/Config';
import CryptManager from '../lib/Crypt/CryptManager';
import MongoDbClient from '../lib/Storage/Mongodb/Client';
import CommonLoader from '../lib/Commons/CommonLoader';
import ApplicationManager from '../lib/Application/Manager/ApplicationManager';
import TestConnector from './Connector/TestConnector';
import TestBasicApplication from './Application/TestBasicApplication';

export function getTestContainer(): DIContainer {
  const container = new DIContainer();
  // Instantiate core services
  const cryptProviders = [
    new WindWalkerCrypt(cryptOptions.secret),
  ];
  const cryptManager = new CryptManager(cryptProviders);
  const mongoDbClient = new MongoDbClient(storageOptions.dsn, cryptManager);
  const loader = new CommonLoader(container);
  const appManager = new ApplicationManager(mongoDbClient, loader);
  const curlSender = new CurlSender();
  const testConnector = new TestConnector(curlSender);
  const app = new TestBasicApplication();

  // Add them to the DIContainer
  container.set('hbpf.core.crypt_manager', cryptManager);
  container.set('hbpf.core.mongo', mongoDbClient);
  container.set('hbpf.core.common_loader', loader);
  container.set('hbpf.core.app_manager', appManager);
  container.set('hbpf.core.curl_sender', curlSender);
  container.setConnector(testConnector.getName(), testConnector);
  container.setApplication(app.getName(), app);

  return container;
}
