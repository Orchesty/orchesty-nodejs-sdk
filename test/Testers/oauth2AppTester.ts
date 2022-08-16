import { question } from 'readline-sync';
import DIContainer from '../../lib/DIContainer/Container';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import { AUTHORIZATION_FORM } from '../../lib/Application/Base/AApplication';
import { CLIENT_ID, CLIENT_SECRET } from '../../lib/Authorization/Type/OAuth2/IOAuth2Application';
import MongoDbClient from '../../lib/Storage/Mongodb/Client';
import CoreServices from '../../lib/DIContainer/CoreServices';
import ApplicationManager from '../../lib/Application/Manager/ApplicationManager';
import { OAuth2Provider } from '../../lib/Authorization/Provider/OAuth2/OAuth2Provider';

export default async function runCli(di: DIContainer, customSettings: Record<string, unknown>) {
  const user = 'default_test_user';

  const name = question('Insert Application name: ');
  const clientId = question('Insert Client Id: ');
  const clientSecret = question('Insert Client Secret: ');

  const appInstall = new ApplicationInstall();
  appInstall
    .setName(name)
    .setUser(user)
    .setSettings({
      [AUTHORIZATION_FORM]: {
        [CLIENT_ID]: clientId,
        [CLIENT_SECRET]: clientSecret,
      },
    });
  appInstall.addSettings(customSettings);

  const db = di.get(CoreServices.MONGO) as MongoDbClient;
  const repo = await db.getApplicationRepository();
  await repo.insert(appInstall);

  const appManager = di.get(CoreServices.APP_MANAGER) as ApplicationManager;
  const resp = await appManager.authorizationApplication(name, user, '');
  // eslint-disable-next-line no-console
  console.log(resp);

  const returnUri = question('Insert returned url: ');
  const req = new URL(returnUri);

  const parameters: Record<string, string> = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of req.searchParams.entries()) {
    parameters[key] = value;
  }

  const { state } = parameters as { state?: string };
  if (!state) {
    throw Error('Missing "state" query parameter.');
  }
  const stateDecode = OAuth2Provider.stateDecode(state.toString());

  await appManager.saveAuthorizationToken(stateDecode.name, stateDecode.user, parameters);
  const updatedApp = await repo.findByNameAndUser(stateDecode.name, stateDecode.user);

  // eslint-disable-next-line no-console
  console.log(updatedApp?.getSettings());
}
