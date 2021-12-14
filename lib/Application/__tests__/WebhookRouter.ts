import faker from 'faker';
import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { Db } from 'mongodb';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';
import { IApplication } from '../Base/IApplication';
import DIContainer from '../../DIContainer/Container';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import { AUTHORIZATION_SETTINGS } from '../Base/AApplication';
import { CLIENT_ID } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Metrics from '../../Metrics/Metrics';

let webhookApplication: IApplication;
let container: DIContainer;
let dbClient: MongoDbClient;
let appInstall: ApplicationInstall;
let db: Db;
let name: string;
let user: string;

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  ctxFromDto: () => jest.fn(),
  ctxFromReq: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('tests for WebhookRouter', () => {
  beforeAll(async () => {
    container = await getTestContainer();
    webhookApplication = container.getApplication('webhookName');
    dbClient = container.get(CoreServices.MONGO);
    db = await dbClient.db();
  });

  /* eslint-enable @typescript-eslint/naming-convention */
  beforeEach(async () => {
    try {
      await db.dropCollection(ApplicationInstall.getCollection());
      const repo = await dbClient.getRepository(ApplicationInstall);
      user = faker.name.firstName();
      name = webhookApplication.getName();

      appInstall = new ApplicationInstall()
        .setUser(user)
        .setName(name);
      appInstall.setSettings({
        [AUTHORIZATION_SETTINGS]: {
          [CLIENT_ID]: 'client id 1',
        },
      });

      await repo.insert(appInstall);
    } catch (e) {
      // Ignore non-existent
    }
  });

  afterAll(async () => {
    await dbClient.down();
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('post /webhook/applications/:name/users/:user/subscribe', async () => {
    const applicationUrl = `/webhook/applications/${name}/users/${user}/subscribe`;
    const body = {
      name: 'testTopoName',
      topology: 'testTopo',
    };
    await supertest(expressApp)
      .post(applicationUrl)
      .send(body)
      .expect(StatusCodes.OK, JSON.stringify([]));
  });

  it('get /webhook/applications/:name/users/:user/unsubscribe', async () => {
    const applicationUrl = `/webhook/applications/${name}/users/${user}/unsubscribe`;
    const body = {
      name: 'testTopoName',
      topology: 'testTopo',
    };
    await supertest(expressApp)
      .post(applicationUrl)
      .send(body)
      .expect(StatusCodes.OK, JSON.stringify([]));
  });
});
