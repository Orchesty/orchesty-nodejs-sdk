import CoreFormsEnum from '../../../Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import { CLIENT_ID, CLIENT_SECRET } from '../../Type/OAuth2/IOAuth2Application';
import AOAuthProvider from '../AOAuthProvider';
import OAuth2Dto from '../Dto/OAuth2Dto';
import { OAuth2Provider } from '../OAuth2/OAuth2Provider';

describe('OAuth2Provider tests', () => {
    const authUrl = 'https://identity.idoklad.cz/server/connect/authorize';
    const user = 'user';
    const app = 'testApp';
    const scope = ['idoklad_api', 'offline_access'];

    const oauth2Provider = new OAuth2Provider('testBackend');
    const appInstall = new ApplicationInstall();

    it('authorize', () => {
        appInstall.addSettings({
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [CLIENT_SECRET]: '**469040-****-4e03-861e-e19da38*****',
                [CLIENT_ID]: '**469040-****-4e03-861e-e19da38*****',
            },
        });
        const dto = new OAuth2Dto(appInstall, authUrl, 'https://identity.idoklad.cz/server/connect/token');
        dto.setCustomAppDependencies(user, app);

        expect(oauth2Provider.authorize(dto, scope)).toEqual(
            'https://identity.idoklad.cz/server/connect/authorize?response_type=code&client_id=**469040-****-4e03-861e-e19da38*****&redirect_uri=testBackend%2Fapi%2Fapplications%2Fauthorize%2Ftoken&scope=idoklad_api%2Coffline_access&state=dXNlcjp0ZXN0QXBw&access_type=offline',
        );
    });

    it(
        'should throw an exception when refresh the user token and the token is not found inside the request',
        async () => {
            const dto = new OAuth2Dto(appInstall, authUrl, 'https://identity.idoklad.cz/server/connect/token');
            const errorMsg = 'Message [Refresh token not found! Refresh is not possible.] code [205]';

            await expect(oauth2Provider.refreshAccessToken(dto, {})).rejects.toThrow(errorMsg);
        },
    );

    it('throwException', () => {
        const message = 'testThrow';
        const code = 666;

        try {
            AOAuthProvider.throwException(message, code);
        } catch (e) {
            if (e instanceof Error) {
                expect(e.message).toEqual(`Message [${message}] code [${code}]`);
            }
        }
    });
});
