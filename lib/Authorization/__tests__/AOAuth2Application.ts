import faker from 'faker';
import TestOAuth2Application from '../../../test/Application/TestOAuth2Application';
import { getTestContainer } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import { AUTHORIZATION_SETTINGS } from '../../Application/Base/AApplication';
import { TOKEN } from '../Type/Basic/ABasicApplication';
import { ACCESS_TOKEN } from '../Provider/OAuth2/OAuth2Provider';
import { CLIENT_ID } from '../Type/OAuth2/IOAuth2Application';
import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import { AuthorizationCode } from 'simple-oauth2';

describe('Test AOAuth2Application', () => {
  const container = getTestContainer();
  // jest.spyOn(AuthorizationCode , 'authorizeURL').mockImplementation((params)=>{
  //   return "asdf";
  // });

  jest.createMockFromModule("simple-oauth2");

  const oAuthApplication = new TestOAuth2Application(container.get(CoreServices.OAUTH2_PROVIDER));

  it('should get authorizationType', () => {
    const type = 'oauth2';
    const applicationType = oAuthApplication.getAuthorizationType();
    expect(type).toBe(applicationType);
  });

  it('should check if application authorized and has access token', () => {
    const appInstall = new ApplicationInstall()
      .setUser('user')
      .setName(oAuthApplication.getName());
    const settings = {
      [AUTHORIZATION_SETTINGS]: {
        [TOKEN]: {
          [ACCESS_TOKEN]: faker.internet.password(),
        },
      },
    };
    appInstall.setSettings(settings);
    const isAuthorized = oAuthApplication.isAuthorized(appInstall);
    expect(isAuthorized).toBeTruthy();
  });

  it("should check if application is not authorized and doesn't has access token", () => {
    const appInstall = new ApplicationInstall()
      .setUser('user')
      .setName(oAuthApplication.getName());
    const settings = {
      [AUTHORIZATION_SETTINGS]: {
        [TOKEN]: '',
      },
    };
    appInstall.setSettings(settings);
    const isAuthorized = oAuthApplication.isAuthorized(appInstall);
    expect(isAuthorized).toBeFalsy();
  });

  it('should get application form data', () => {
    const keysToBeReturned = ['client_id', 'client_secret', 'frontend_redirect_url'];
    const appInstall = new ApplicationInstall()
      .setUser('user')
      .setName(oAuthApplication.getName());
    const data = oAuthApplication.getApplicationForm(appInstall);

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const keyIndex in keysToBeReturned) {
      expect(data[keyIndex].key).toBe(keysToBeReturned[keyIndex]);
    }
  });

  it.skip('should refresh authorization token', async () => {
    // Todo : need the mocking
    const appInstall = new ApplicationInstall()
      .setUser('user')
      .setName(oAuthApplication.getName());
    const settings = {
      [AUTHORIZATION_SETTINGS]: {
        [CLIENT_ID]: 'asd',
        [TOKEN]: "asd"
      },
    };
    appInstall.setSettings(settings);

    const data = await oAuthApplication.refreshAuthorization(appInstall);
    console.log("asd",data);
    // expect(data).toEqual("asd");
  });

  it('should get access token', () => {
    const appInstall = new ApplicationInstall()
      .setUser('user')
      .setName(oAuthApplication.getName());
    const accessToken = faker.internet.password();
    const settings = {
      [AUTHORIZATION_SETTINGS]: {
        [TOKEN]: {
          [ACCESS_TOKEN]: accessToken,
        }
      },
    };
    appInstall.setSettings(settings);
    const accessTokenFromService = oAuthApplication.getAccessToken(appInstall);
    expect(accessToken).toEqual(accessTokenFromService);
  });

  it('should set application settings', () => {
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: [] });
    appInstall.addSettings({ form: [] });
    const sett = { user: 'Jakub', password: 'pass', token: 'token' };
    expect(oAuthApplication.setApplicationSettings(appInstall, sett)).toBeInstanceOf(ApplicationInstall);
  });

  it('should get token', () => {
    const appInstall = new ApplicationInstall();
    const token = faker.internet.password();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: { [TOKEN]: token } });
    appInstall.addSettings({ form: [] });
    const tokenFromService = oAuthApplication.getTokens(appInstall);
    expect(token).toEqual(tokenFromService);
  });

  it('should throw error when try to get access token and access token is not found', function () {
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: {[TOKEN]: {}}  });
    try {
      oAuthApplication.getAccessToken(appInstall);
    } catch (e) {
      expect(e.message).toEqual('There is no access token');
    }
  });
});
