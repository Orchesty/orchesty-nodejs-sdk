import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import faker from 'faker';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { encode } from '../../Utils/Base64';
import { OAuth2Provider } from '../../Authorization/Provider/OAuth2/OAuth2Provider';

const container = getTestContainer();
const application = container.getApplication('test');
const oAuthApplication = container.getApplication('oauth2application');
let dbClient: MongoDbClient;

jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../Authorization/Provider/OAuth2/OAuth2Provider');

describe('Test ApplicationRouter', () => {
  /* eslint-enable @typescript-eslint/naming-convention */
  beforeAll(async () => {
    dbClient = container.get(CoreServices.MONGO);
    const db = await dbClient.db();
    try {
      await db.dropCollection(ApplicationInstall.getCollection());
    } catch (e) {
      // Ignore non-existent
    }
  });

  it('get /applications route', async () => {
    const connectorUrl = '/applications';
    const expectedResult = '["test","oauth2application"]';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name route', async () => {
    const connectorUrl = `/applications/${application.getName()}`;
    // eslint-disable-next-line max-len
    const expectedResult = '{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description"}';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name/sync/list route', async () => {
    const connectorUrl = `/applications/${application.getName()}/sync/list`;
    const expectedResult = '["testSyncMethod"]';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('post /applications/:name/sync/:method route', async () => {
    const method = 'testSyncMethod';
    const connectorUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
    await supertest(expressApp)
      .post(connectorUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('get /applications/:name/sync/:method route', async () => {
    const method = 'testSyncMethod';
    const connectorUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.OK, expectedResult);
  });

  it('throw error on get /applications/:name/users/:user/authorize route cause ', async () => {
    // Todo : 500 response
    const connectorUrl = `/applications/${application.getName()}/users/${application.getName()}/authorize`;
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it('get /applications/:name/users/:user/authorize route', async () => {
    const user = 'user';
    const name = oAuthApplication.getName();
    const appInstall = new ApplicationInstall()
      .setUser(user)
      .setName(name);
    const repo = await dbClient.getRepository(ApplicationInstall);

    await repo.insert(appInstall);

    const connectorUrl = `/applications/${name}/users/${user}/authorize`;
    const expectedResult = '{}';
    await supertest(expressApp)
      .get(connectorUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ redirect_url: faker.internet.url() })
      .expect(StatusCodes.OK, expectedResult);
  });

  xit('get /applications/authorize/token route', async () => {
    const oAuth2Provider = new OAuth2Provider('');

    const user = 'user';
    const name = oAuthApplication.getName();
    // (OAuth2Provider.stateDecode as jest.MockedFunction<typeof OAuth2Provider.stateDecode>)
    //   .mockReturnValue({ user, name });
    (oAuth2Provider.getAccessToken as jest.MockedFunction<typeof oAuth2Provider.getAccessToken>)
      .mockResolvedValue({});

    const appInstall = new ApplicationInstall()
      .setUser(user)
      .setName(name);
    const repo = await dbClient.getRepository(ApplicationInstall);

    await repo.insert(appInstall);

    const connectorUrl = '/applications/authorize/token';
    const expectedResult = '{"authorizeUrl":"https://identity.idoklad.cz/server/connect/authorize?response_type=code&client_id=&redirect_uri=http%3A%2F%2F127.0.0.40%3A8080%2Fapi%2Fapplications%2Fauthorize%2Ftoken&scope=idoklad_api%20offline_access&state=dXNlcjpvYXV0aDJhcHBsaWNhdGlvbg&access_type=offline"}';
    const state = encode(`${user}:${name}`); // base64
    await supertest(expressApp)
      .get(connectorUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ state })
      .expect(expectedResult);
  });

  // it.skip('get /applications/:name/users/:user/authorize/token route', async () => {
  //   const user = 'user';
  //   const name = oAuthApplication.getName();
  //   const appInstall = new ApplicationInstall()
  //     .setUser(user)
  //     .setName(name);
  //   const repo = await dbClient.getRepository(ApplicationInstall);
  //
  //   await repo.insert(appInstall);
  //   const connectorUrl = `/applications/${name}/users/${user}/authorize/token`;
  //   const expectedResult = '{"authorizeUrl":"https://identity.idoklad.cz/server/connect/authorize?response_type=code&client_id=&redirect_uri=http%3A%2F%2F127.0.0.40%3A8080%2Fapi%2Fapplications%2Fauthorize%2Ftoken&scope=idoklad_api%20offline_access&state=dXNlcjpvYXV0aDJhcHBsaWNhdGlvbg&access_type=offline"}';
  //
  //   await supertest(expressApp)
  //     .get(connectorUrl)
  //     // eslint-disable-next-line @typescript-eslint/naming-convention
  //     .query({ redirect_url: faker.internet.url()})
  //     .expect(expectedResult);
  // });
});
