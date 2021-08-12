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

const container = getTestContainer();
const application = container.getApplication('test');
const oAuthApplication = container.getApplication('oauth2application');
const provider = container.get(CoreServices.OAUTH2_PROVIDER);

let dbClient: MongoDbClient;
let appInstall: ApplicationInstall;
let name: string;
let user: string;
let authorizationURL: string;

jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test ApplicationRouter', () => {
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
            access_token: '', token_type: '', refresh_token: '', expires_at: '',
          },
        }),
        authorizeURL: () => authorizationURL,
      }));
    } catch (e) {
      // Ignore non-existent
    }
  });

  it('get /applications route', async () => {
    const applicationUrl = '/applications';
    const expectedResult = '["test","oauth2application"]';
    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name route', async () => {
    const applicationUrl = `/applications/${application.getName()}`;
    // eslint-disable-next-line max-len
    const expectedResult = '{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description"}';
    await supertest(expressApp)
      .get(applicationUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name/sync/list route', async () => {
    const applicationUrl = `/applications/${application.getName()}/sync/list`;
    const expectedResult = '["testSyncMethod"]';
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
      .expect(StatusCodes.OK,expectedResult);
  });

  it('get /applications/authorize/token route', async () => {
    const applicationUrl = '/applications/authorize/token';
    const expectedResult = '{}';
    const state = encode(`${user}:${name}`); // base64
    await supertest(expressApp)
      .get(applicationUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ state })
      .expect(StatusCodes.OK,expectedResult);
  });

  it('get /applications/:name/users/:user/authorize/token route', async () => {
    const redirectUrl = faker.internet.url();
    const applicationUrl = `/applications/${name}/users/${user}/authorize/token`;
    const expectedResult = '{}';

    await supertest(expressApp)
      .get(applicationUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ redirect_url: redirectUrl })
      .expect(StatusCodes.OK,expectedResult);
  });
});
