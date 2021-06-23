import TestOAuth2Application from '../TestOAuth2Application';
import { OAuth2Provider } from '../../../lib/Authorization/Provider/OAuth2/OAuth2Provider';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import { AUTHORIZATION_SETTINGS } from '../../../lib/Application/Base/ApplicationAbstract';
import { CLIENT_ID, CLIENT_SECRET } from '../../../lib/Authorization/Type/OAuth2/IOAuth2Application';

// Mock Logger module
jest.mock('../../../lib/Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test OAuth2 application', () => {
  it('should ', () => {
    const provider = new OAuth2Provider('testoauth2');
    const app = new TestOAuth2Application(provider);
    const appInstall = new ApplicationInstall();
    appInstall.setUser('testUser');
    appInstall.setKey('testKey');
    appInstall.addSettings({
      [AUTHORIZATION_SETTINGS]: {
        [CLIENT_SECRET]: 'testSecret',
        [CLIENT_ID]: 'testClientId',
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const authUrl = app.authorize(appInstall);
  });
});
