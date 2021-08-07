import Application from '../Application';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import faker from 'faker';

describe('Application utils tests', () => {
  it('generateUrl with appInstall', () => {
    const user: string = faker.name.firstName();
    const name: string = faker.name.firstName();
    const url = `/api/applications/${name}/users/${user}/authorize/token`;
    const applicationInstall = new ApplicationInstall()
      .setUser(user)
      .setName(name);
    const applicationUrl: string = Application.generateUrl(applicationInstall);
    expect(applicationUrl).toEqual(url);
  });
});
