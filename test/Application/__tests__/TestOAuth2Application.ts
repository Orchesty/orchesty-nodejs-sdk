import TestOAuth2Application from "../TestOAuth2Application";
import {OAuth2Provider} from "../../../lib/Authorization/Provider/OAuth2/OAuth2Provider";
import {ApplicationInstall} from "../../../lib/Application/Database/ApplicationInstall";
import {AUTHORIZATION_SETTINGS} from "../../../lib/Application/Base/ApplicationAbstract";
import {CLIENT_ID, CLIENT_SECRET} from "../../../lib/Authorization/Type/OAuth2/IOAuth2Application";

describe('Test OAuth2 application', () => {
  it('should ', function () {
    let provider = new OAuth2Provider('testoauth2');
    let app = new TestOAuth2Application(provider);
    let appInstall = new ApplicationInstall();
    appInstall.setUser('testUser');
    appInstall.setKey('testKey');
    appInstall.addSettings({
      [AUTHORIZATION_SETTINGS]: {
        [CLIENT_SECRET]: 'testSecret',
        [CLIENT_ID]: 'testClientId',
      }
    });
    let a = app.authorize(appInstall);
  });
})
