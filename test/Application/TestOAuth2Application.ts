import OAuth2ApplicationAbstract from '../../lib/Authorization/Type/OAuth2/OAuth2ApplicationAbstract';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Form from '../../lib/Application/Model/Form/Form';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import HttpMethods from '../../lib/Transport/HttpMethods';
import { CLIENT_ID, CLIENT_SECRET } from '../../lib/Authorization/Type/OAuth2/IOAuth2Application';
import ScopeSeparatorEnum from '../../lib/Authorization/ScopeSeparatorEnum';

export default class TestOAuth2Application extends OAuth2ApplicationAbstract {
  public getAuthUrl = (): string => 'https://identity.idoklad.cz/server/connect/authorize';

  public getDescription = (): string => 'Test OAuth2 application';

  public getName = (): string => 'oauth2application';

  public getPublicName = (): string => 'Test OAuth2 Application';

  public getRequestDto =
    // eslint-disable-next-line max-len
    (applicationInstall: ApplicationInstall, method: HttpMethods, url?: string, data?: string): RequestDto => new RequestDto(url ?? '', HttpMethods.GET, data);

  public getSettingsForm = (): Form => {
    const label = 'testLabel';
    const fieldClientId = new Field(FieldType.TEXT, CLIENT_ID, label);
    const fieldClientSecret = new Field(FieldType.PASSWORD, CLIENT_SECRET, label);

    const form = new Form();
    form.addField(fieldClientId);
    form.addField(fieldClientSecret);
    return form;
  };

  public getTokenUrl = (): string => 'https://identity.idoklad.cz/server/connect/token';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getScopes = (applicationInstall: ApplicationInstall): string[] => ['idoklad_api', 'offline_access'];

  protected getScopesSeparator = (): string => ScopeSeparatorEnum.SPACE;
}