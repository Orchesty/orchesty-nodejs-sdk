import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import Application from '../Application';

describe('Application utils tests', () => {
  it('generateUrl with appInstall', () => {
    const user = 'user';
    const name = 'name';
    const url = `/api/applications/${name}/users/${user}/authorize/token`;
    const applicationInstall = new ApplicationInstall()
      .setUser(user)
      .setName(name);
    const applicationUrl: string = Application.generateUrl(applicationInstall);
    expect(applicationUrl).toEqual(url);
  });
});
