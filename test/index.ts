import { ApplicationInstall } from '../lib/Application/Database/ApplicationInstall';
import MongoDbClient from '../lib/Storage/Mongodb/Client';
import { CLIENT_ID, CLIENT_SECRET } from '../lib/Authorization/Type/OAuth2/IOAuth2Application';
import logger from '../lib/Logger/Logger';
import CoreServices from '../lib/DIContainer/CoreServices';
import { APPLICATION_PREFIX } from '../lib/Application/ApplicationRouter';
import { getTestContainer, listen } from './TestAbstact';

const container = getTestContainer();

const key = 'oauth2application';
const user = 'user';
const db = container.get(CoreServices.MONGO) as MongoDbClient;
db.getRepository(ApplicationInstall).then(async (repository) => {
  const appInstall = await repository.findOne({key, user});
  if (appInstall) {
    await repository.remove(appInstall);
  }
  const newAppInstall = new ApplicationInstall();
  newAppInstall.setKey(key).setUser(user);

  const testApp = container.get(`${APPLICATION_PREFIX}.${key}`);

  testApp.setApplicationSettings(newAppInstall, {
    [CLIENT_SECRET]: '**469040-****-4e03-861e-e19da38*****',
    [CLIENT_ID]: '**89f69a-44f4-4163-****-3090edc*****',
  });
  await repository.insert(newAppInstall);
  logger.info('Document inserted');
});

listen();
