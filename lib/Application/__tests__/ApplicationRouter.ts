import supertest from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';
import { Logger } from '../../Logger/Logger';
const container = getTestContainer();
const application = container.getApplication('test');
const oAuthApplication = container.getApplication('oauth2application');

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test ConnectorRouter', () => {
  /* eslint-disable @typescript-eslint/naming-convention */
  Logger.ctxFromDto = jest.fn().mockReturnValue({
    node_id: '1',
    correlation_id: '1',
    process_id: '1',
    parent_id: '1',
    sequence_id: '1',
  });
  /* eslint-enable @typescript-eslint/naming-convention */

  it('get /applications route', async () => {
    const connectorUrl = '/applications';
    const expectedResult = '["test","oauth2application"]';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200, expectedResult);
  });

  it('get /applications/:name route', async () => {
    const connectorUrl = `/applications/${application.getName()}`;
    // eslint-disable-next-line max-len
    const expectedResult = '{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description"}';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200,expectedResult );
  });

  it('get /applications/:name/sync/list route', async () => {
    const connectorUrl = `/applications/${application.getName()}/sync/list`;
    const expectedResult = '["testSyncMethod"]';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200, expectedResult);
  });

  it('post /applications/:name/sync/:method route', async () => {
    const method = 'testSyncMethod';
    const connectorUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
    await supertest(expressApp)
      .post(connectorUrl)
      .expect(200, expectedResult);
  });

  it('get /applications/:name/sync/:method route', async () => {
    const method = 'testSyncMethod';
    const connectorUrl = `/applications/${application.getName()}/sync/${method}`;
    const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(200, expectedResult);
  });

  it('throw error on get /applications/:name/users/:user/authorize route cause ', async () => {
    //Todo : Edit the response it doesn't return 500 and edit this test because redirectUrl is missing
    const connectorUrl = `/applications/${application.getName()}/users/${application.getName()}/authorize`;
    await supertest(expressApp)
      .get(connectorUrl)
      .expect(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it('get /applications/:name/users/:user/authorize route', async () => {
    const connectorUrl = `/applications/${oAuthApplication.getName()}/users/user/authorize`;
    const expectedResult = '{"authorizeUrl":"https://identity.idoklad.cz/server/connect/authorize?response_type=code&client_id=&redirect_uri=http%3A%2F%2F127.0.0.40%3A8080%2Fapi%2Fapplications%2Fauthorize%2Ftoken&scope=idoklad_api%20offline_access&state=dXNlcjpvYXV0aDJhcHBsaWNhdGlvbg&access_type=offline"}';
    await supertest(expressApp)
      .get(connectorUrl)
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .query({ redirect_url: "http://uri.com" })
      .expect(StatusCodes.OK ,expectedResult);
  });
});
