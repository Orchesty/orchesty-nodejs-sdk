import supertest from 'supertest';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';
import { APPLICATION_PREFIX } from '../ApplicationRouter';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import CoreServices from '../../DIContainer/CoreServices';

const container = getTestContainer();
const app = container.get(`${APPLICATION_PREFIX}.test`);
const appOAuth2 = container.get(`${APPLICATION_PREFIX}.oauth2application`);

describe('test Application router', () => {
  it('get /applications', async () => {
    const routerUri = '/applications';
    await supertest(expressApp).get(routerUri).expect(['test', 'oauth2application']);
  });
  it('get /applications/:name/sync/list', async () => {
    const routerUri = `/applications/${app.getName()}/sync/list`;
    await supertest(expressApp).get(routerUri).expect(['testSyncMethod']);
  });
  it('get /applications/:name', async () => {
    const routerUri = `/applications/${app.getName()}`;
    await supertest(expressApp).get(routerUri).expect({
      name: 'Test application',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      authorization_type: 'basic',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      application_type: 'cron',
      key: 'test',
      description: 'Test description',
    });
  });
  it('get /applications/:name/sync/:method', async () => {
    const routerUri = `/applications/${app.getName()}/sync/testSyncMethod`;
    await supertest(expressApp).get(routerUri).expect('"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"');
  });
  xit('get /applications/:name/users/:user/authorize', async () => {
    const dbClient = container.get(CoreServices.MONGO);
    const appInstall = new ApplicationInstall();
    appInstall.setUser('Bobr').setKey('BobrKey').setSettings({ key: 'BobrValue' });

    const repo = await dbClient.getRepository(ApplicationInstall);
    await repo.insert(appInstall);
    const routerUri = `/applications/${appOAuth2.getName()}/users/Bobr/authorize`;
    await supertest(expressApp).get(routerUri).expect(['testSyncMethod']);
  });
  xit('get /applications/authorize/token', async () => {
    const routerUri = '/applications/authorize/token';
    // eslint-disable-next-line max-len
    await supertest(expressApp).get(routerUri).query({ state: 'Qm9icjpCb2JyS2V5' }).expect(['testSyncMethod']);
  });
});
