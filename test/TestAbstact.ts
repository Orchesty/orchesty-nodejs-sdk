import DIContainer from '../lib/DIContainer/Container';
import CurlSender from '../lib/Transport/Curl/CurlSender';
import WindWalkerCrypt from '../lib/Crypt/Impl/WindWalkerCrypt';
import { cryptOptions, pipesOptions, storageOptions } from '../lib/Config/Config';
import CryptManager from '../lib/Crypt/CryptManager';
import MongoDbClient from '../lib/Storage/Mongodb/Client';
import CommonLoader from '../lib/Commons/CommonLoader';
import ApplicationManager from '../lib/Application/Manager/ApplicationManager';
import TestConnector from './Connector/TestConnector';
import TestBasicApplication from './Application/TestBasicApplication';
import CoreServices from '../lib/DIContainer/CoreServices';
import { OAuth2Provider } from '../lib/Authorization/Provider/OAuth2/OAuth2Provider';
import TestOAuth2Application from './Application/TestOAuth2Application';

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
  const oauth2Provider = new OAuth2Provider(pipesOptions.backend);
  const curlSender = new CurlSender();
  const testConnector = new TestConnector(curlSender);
  const appBasic = new TestBasicApplication();
  const appOAuth = new TestOAuth2Application(oauth2Provider);

  // Add them to the DIContainer
  container.set(CoreServices.CRYPT_MANAGER, cryptManager);
  container.set(CoreServices.MONGO, mongoDbClient);
  container.set(CoreServices.LOADER, loader);
  container.set(CoreServices.APP_MANAGER, appManager);
  container.set(CoreServices.OAUTH2_PROVIDER, oauth2Provider);
  container.set(CoreServices.CURL, curlSender);
  container.setConnector(testConnector.getName(), testConnector);
  container.setApplication(appBasic.getName(), appBasic);
  container.setApplication(appOAuth.getName(), appOAuth);

  return container;
}

export default { getTestContainer };
