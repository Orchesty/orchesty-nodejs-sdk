import OAuth2Dto from '../Dto/OAuth2Dto';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import { AUTHORIZATION_SETTINGS } from '../../../Application/Base/ApplicationAbstract';
import { CLIENT_ID, CLIENT_SECRET } from '../../Type/OAuth2/IOAuth2Application';
import { OAuth2Provider } from '../OAuth2/OAuth2Provider';

describe('OAuth2Provider tests', () => {
  it('authorize ', () => {
    const authUrl = 'https://identity.idoklad.cz/server/connect/authorize';
    const redirectUrl = 'httpjjj://127.0.0.40:8080/applications/authorize/token';
    const user = 'user';
    const app = 'testApp';
    const scope = ['idoklad_api', 'offline_access'];

    const oauth2Provider = new OAuth2Provider('testBackend');
    const appInstall = new ApplicationInstall();
    // eslint-disable-next-line max-len
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: { [CLIENT_SECRET]: '**469040-****-4e03-861e-e19da38*****', [CLIENT_ID]: '**469040-****-4e03-861e-e19da38*****' } });
    const dto = new OAuth2Dto(appInstall, authUrl, 'https://identity.idoklad.cz/server/connect/token');
    dto.setRedirectUrl(redirectUrl);
    dto.setCustomAppDependencies(user, app);
    expect(oauth2Provider.authorize(dto, scope)).toEqual(
      'https://identity.idoklad.cz/server/connect/authorize?response_type=code&client_id=**469040-****-4e03-861e-e19da38*****&redirect_uri=httpjjj%3A%2F%2F127.0.0.40%3A8080%2Fapplications%2Fauthorize%2Ftoken&scope=idoklad_api%2Coffline_access&state=dXNlcjp0ZXN0QXBw&access_type=offline',
    );
  });
});
