import TestBasicApplication from '../TestBasicApplication';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import { AUTHORIZATION_SETTINGS } from '../../../lib/Application/Base/AApplication';

describe('Application authorize tests', () => {
  it('isAuthorized', () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: [] });
    basicApp.setApplicationUser(appInstall, 'Jakub');
    basicApp.setApplicationPassword(appInstall, 'passs');
    expect(basicApp.isAuthorized(appInstall)).toEqual(true);
  });

  it('isNotAuthorized', () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: [] });
    expect(basicApp.isAuthorized(appInstall)).toEqual(false);
  });

  it('setApplicationToken', () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: [] });
    expect(basicApp.setApplicationToken(appInstall, 'token')).toBeInstanceOf(ApplicationInstall);
  });

  it('setApplicationSettings', () => {
    const basicApp = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    appInstall.addSettings({ [AUTHORIZATION_SETTINGS]: [] });
    appInstall.addSettings({ form: [] });
    const sett = { user: 'Jakub', password: 'pass', token: 'token' };
    expect(basicApp.setApplicationSettings(appInstall, sett)).toBeInstanceOf(ApplicationInstall);
  });
});
