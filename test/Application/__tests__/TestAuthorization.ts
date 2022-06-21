import TestBasicApplication from '../TestBasicApplication';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import { AUTHORIZATION_FORM } from '../../../lib/Application/Base/AApplication';
import { PASSWORD, TOKEN, USER } from '../../../lib/Authorization/Type/Basic/ABasicApplication';
import TestTokenBasicApplication from '../TestTokenBasicApplication';

describe('Application authorize tests', () => {
  it('isAuthorized', () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    const settings = { [AUTHORIZATION_FORM]: { [USER]: 'Jakub', [PASSWORD]: 'pass' } };
    basicApp.saveApplicationForms(appInstall, settings);
    expect(basicApp.isAuthorized(appInstall)).toEqual(true);
  });

  it('isNotAuthorized', () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_FORM]: [] });
    expect(basicApp.isAuthorized(appInstall)).toEqual(false);
  });

  it('setApplicationToken', () => {
    const basicApp = new TestTokenBasicApplication();
    const appInstall = new ApplicationInstall();
    const settings = { [AUTHORIZATION_FORM]: { [TOKEN]: 'token' } };
    basicApp.saveApplicationForms(appInstall, settings);
    expect(basicApp.isAuthorized(appInstall)).toEqual(true);
  });

  it('setApplicationSettings', async () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    const sett = {
      [AUTHORIZATION_FORM]: { [USER]: 'Jakub', [PASSWORD]: 'pass' },
    };
    const sett1 = {
      testForm: { host: 'Jakub', database: 'pass' },
    };
    await basicApp.saveApplicationForms(appInstall, sett);
    await basicApp.saveApplicationForms(appInstall, sett1);
    expect(basicApp.isAuthorized(appInstall)).toEqual(true);
  });
});
