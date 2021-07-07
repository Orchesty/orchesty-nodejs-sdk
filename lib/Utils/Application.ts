import { ApplicationInstall } from '../Application/Database/ApplicationInstall';

export default class Application {
  public static generateUrl(appInstall?: ApplicationInstall): string {
    if (appInstall) {
      return `/api/applications/${appInstall.getName()}/users/${appInstall.getUser()}/authorize/token`;
    }
    return '/api/applications/authorize/token';
  }
}
