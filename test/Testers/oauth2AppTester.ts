import { question } from 'readline-sync';
import CoreFormsEnum from '../../lib/Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import ApplicationManager from '../../lib/Application/Manager/ApplicationManager';
import { OAuth2Provider } from '../../lib/Authorization/Provider/OAuth2/OAuth2Provider';
import { CLIENT_ID, CLIENT_SECRET } from '../../lib/Authorization/Type/OAuth2/IOAuth2Application';
import DIContainer from '../../lib/DIContainer/Container';
import DatabaseClient from '../../lib/Storage/Database/Client';

export default async function runCli(di: DIContainer, customSettings: Record<string, unknown>): Promise<void> {
    const user = 'default_test_user';

    const name = question('Insert Application name: ');
    const clientId = question('Insert Client Id: ');
    const clientSecret = question('Insert Client Secret: ');

    const appInstall = new ApplicationInstall();
    appInstall
        .setName(name)
        .setUser(user)
        .setSettings({
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [CLIENT_ID]: clientId,
                [CLIENT_SECRET]: clientSecret,
            },
        });
    appInstall.addSettings(customSettings);

    const db = di.get(DatabaseClient);
    const repo = db.getApplicationRepository();
    await repo.insert(appInstall);

    const appManager = di.get(ApplicationManager);
    const resp = await appManager.authorizationApplication(name, user, '');
    // eslint-disable-next-line no-console
    console.log(resp);

    const returnUri = question('Insert returned url: ');
    const req = new URL(returnUri);

    const parameters: Record<string, string> = {};

    for (const [key, value] of req.searchParams.entries()) {
        parameters[key] = value;
    }

    const { state } = parameters as { state?: string };
    if (!state) {
        throw Error('Missing "state" query parameter.');
    }
    const stateDecode = OAuth2Provider.stateDecode(state);

    await appManager.saveAuthorizationToken(stateDecode.name, stateDecode.user, parameters);
    const updatedApp = await repo.findByNameAndUser(stateDecode.name, stateDecode.user);

    // eslint-disable-next-line no-console
    console.log(updatedApp?.getSettings());
}
