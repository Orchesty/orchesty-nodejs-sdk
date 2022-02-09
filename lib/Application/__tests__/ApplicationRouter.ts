import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import faker from 'faker';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { encode } from '../../Utils/Base64';
import { AUTHORIZATION_SETTINGS } from '../Base/AApplication';
import { CLIENT_ID } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import Metrics from '../../Metrics/Metrics';
import assertions from './assertions.json';
import DIContainer from '../../DIContainer/Container';
import { IApplication } from '../Base/IApplication';
import { OAuth2Provider } from '../../Authorization/Provider/OAuth2/OAuth2Provider';

jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  ctxFromDto: () => jest.fn(),
  ctxFromReq: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test ApplicationRouter', () => {
  let application: IApplication;
  let oAuthApplication: IApplication;
  let provider: OAuth2Provider;
  let container: DIContainer;
  let dbClient: MongoDbClient;
  let appInstall: ApplicationInstall;
  let name: string;
  let user: string;
  let authorizationURL: string;

  beforeAll(async () => {
    container = await getTestContainer();
    application = container.getApplication('test');
    oAuthApplication = container.getApplication('oauth2application');
    provider = container.get(CoreServices.OAUTH2_PROVIDER);
  });

  /* eslint-enable @typescript-eslint/naming-convention */
  beforeEach(async () => {
    dbClient = container.get(CoreServices.MONGO);
    const db = await dbClient.db();
    try {
      await db.dropCollection(ApplicationInstall.getCollection());
      const repo = await dbClient.getRepository(ApplicationInstall);
      user = faker.name.firstName();
      name = oAuthApplication.getName();
      authorizationURL = faker.internet.url();

      appInstall = new ApplicationInstall()
        .setUser(user)
        .setName(name);
      appInstall.setSettings({
        [AUTHORIZATION_SETTINGS]: {
          [CLIENT_ID]: 'client id 1',
        },
      });

      await repo.insert(appInstall);
      Reflect.set(provider, '_createClient', () => ({
        getToken: () => ({
          token: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ok: true, access_token: 'some_token', token_type: '', refresh_token: '', expires_at: '',
          },
        }),
        authorizeURL: () => authorizationURL,
      }));
    } catch (e) {
      // Ignore non-existent
    }
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('get /applications route', async () => {
    const applicationUrl = '/applications';
    // eslint-disable-next-line max-len
    const expectedResult = '{"items":[{"name":"Test OAuth2 Application","authorization_type":"oauth2","application_type":"cron","key":"oauth2application","description":"Test OAuth2 application","logo":null},{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description","logo":null},{"name":"Test webhook application","authorization_type":"basic","application_type":"webhook","key":"webhookName","description":"Test webhook description","logo":null}]}';

    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name route', async () => {
    const applicationUrl = `/applications/${application.getName()}`;
    // eslint-disable-next-line max-len
    const expectedResult = '{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description","logo":null}';
    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name/sync/list route', async () => {
    const applicationUrl = `/applications/${application.getName()}/sync/list`;
    const expectedResult = '["testSyncMethod","testSyncMethodVoid"]';
    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('post /applications/:name/sync/:method route', async () => {
    const method = 'testSyncMethod';
    const applicationUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
    await supertest(expressApp)
      .post(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('post /applications/:name/sync/:method route with void', async () => {
    const method = 'testSyncMethodVoid';
    const applicationUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '{"status":"ok"}';
    await supertest(expressApp)
      .post(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name/sync/:method route', async () => {
    const method = 'testSyncMethod';
    const applicationUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('throw error on get /applications/:name/users/:user/authorize route cause ', async () => {
    // Todo : 500 response
    const applicationUrl = `/applications/${application.getName()}/users/${application.getName()}/authorize`;
    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it('get /applications/:name/users/:user/authorize route', async () => {
    const applicationUrl = `/applications/${name}/users/${user}/authorize`;
    const expectedResult = `{"authorizeUrl":"${authorizationURL}&access_type=offline"}`;
    await supertest(expressApp)
      .get(applicationUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ redirect_url: faker.internet.url() })
      .expect(expectedResult);
  });

  it('get /applications/authorize/token route', async () => {
    const applicationUrl = '/applications/authorize/token';
    const expectedResult = '{}';
    const state = encode(`${user}:${name}`); // base64
    await supertest(expressApp)
      .get(applicationUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ state })
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name/users/:user/authorize/token route', async () => {
    const redirectUrl = faker.internet.url();
    const applicationUrl = `/applications/${name}/users/${user}/authorize/token`;
    const expectedResult = '{}';

    await supertest(expressApp)
      .get(applicationUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ redirect_url: redirectUrl })
      .expect(StatusCodes.OK, expectedResult);
  });

  it('post /applications/:name/users/:user/install route', async () => {
    const newUser = faker.name.firstName();
    const appName = 'test';
    const applicationUrl = `/applications/${appName}/users/${newUser}/install`;
    const expectedResult = assertions['post /applications/:name/users/:user/install route'];

    await supertest(expressApp)
      .post(applicationUrl)
      .expect((response) => {
        expect(JSON.parse(response.text)).toEqual(expectedResult);
        expect(response.statusCode).toEqual(StatusCodes.CREATED);
      });
  });

  it('should not allow store /applications/:name/users/:user/install if application already exists', async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    const appName = 'test';
    const userName = faker.name.firstName();
    appInstall = new ApplicationInstall()
      .setUser(userName)
      .setName(appName);

    await repo.insert(appInstall);
    const applicationUrl = `/applications/${appName}/users/${userName}/install`;
    await supertest(expressApp)
      .post(applicationUrl)
      .expect(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it('put /applications/:name/users/:user/settings route', async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    const appName = 'test';
    const userName = faker.name.firstName();
    appInstall = new ApplicationInstall()
      .setUser(userName)
      .setName(appName);
    await repo.insert(appInstall);
    const applicationUrl = `/applications/${appName}/users/${userName}/settings`;

    await supertest(expressApp)
      .put(applicationUrl)
      .send({ data: { key: 'name' } })
      .expect((response) => {
        expect(JSON.parse(response.text).user).toEqual(userName);
        expect(response.statusCode).toEqual(StatusCodes.OK);
      });
  });

  it('put /applications/:name/users/:user/password route', async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    const appName = 'test';
    const userName = faker.name.firstName();
    appInstall = new ApplicationInstall()
      .setUser(userName)
      .setName(appName);
    await repo.insert(appInstall);
    const applicationUrl = `/applications/${appName}/users/${userName}/password`;
    const password = faker.internet.password();
    await supertest(expressApp)
      .put(applicationUrl)
      .send({ password })
      .expect((response) => {
        const responsePassword = JSON.parse(response.text).applicationSettings[0].value;
        expect(responsePassword).toBeTruthy();
      });
  });

  it('put /applications/:name/users/:user/uninstall route', async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    const appName = 'test';
    const userName = faker.name.firstName();
    appInstall = new ApplicationInstall()
      .setUser(userName)
      .setName(appName);
    await repo.insert(appInstall);

    const applicationUrl = `/applications/${appName}/users/${userName}/uninstall`;
    await supertest(expressApp)
      .delete(applicationUrl)
      .expect((response) => {
        // eslint-disable-next-line max-len
        // Todo : There's a decorator that basically force to add delete = false ,await repo.findOne({ key: appName, user: userName , deleted: true });
        expect(response.statusCode).toEqual(StatusCodes.OK);
      });
  });

  it('get /applications/:name/users/:user route', async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    const appName = 'test';
    const userName = faker.name.firstName();
    appInstall = new ApplicationInstall()
      .setUser(userName)
      .setName(appName);
    await repo.insert(appInstall);
    const applicationUrl = `/applications/${appName}/users/${userName}`;
    await supertest(expressApp)
      .get(applicationUrl)
      .send({ name: userName, user: userName }).expect((response) => {
        expect(response.statusCode).toEqual(StatusCodes.OK);
        expect(response.body).toHaveProperty('name');
        expect(response.body.key).toEqual('test');
        expect(response.body).toHaveProperty('applicationSettings');
        expect(response.body).toHaveProperty('webhookSettings');
      });
  });

  it('get /applications/users/:user route', async () => {
    const repo = await dbClient.getRepository(ApplicationInstall);
    const appName = 'test';
    const userName = faker.name.firstName();
    appInstall = new ApplicationInstall()
      .setUser(userName)
      .setName(appName);
    await repo.insert(appInstall);
    const applicationUrl = `/applications/users/${userName}`;
    await supertest(expressApp)
      .get(applicationUrl)
      .send({ name: userName, user: userName }).expect((response) => {
        expect(response.statusCode).toEqual(StatusCodes.OK);
        expect(response.body).toHaveProperty('items');
        expect(response.body.items).toHaveLength(1);
      });
  });
});
