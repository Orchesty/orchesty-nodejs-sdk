import { BodyInit } from 'node-fetch';
import { AUTHORIZATION_FORM } from '../../lib/Application/Base/AApplication';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import Form from '../../lib/Application/Model/Form/Form';
import FormStack from '../../lib/Application/Model/Form/FormStack';
import ScopeSeparatorEnum from '../../lib/Authorization/ScopeSeparatorEnum';
import AOAuth2Application from '../../lib/Authorization/Type/OAuth2/AOAuth2Application';
import { CLIENT_ID, CLIENT_SECRET } from '../../lib/Authorization/Type/OAuth2/IOAuth2Application';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestOAuth2Application extends AOAuth2Application {
  public getAuthUrl = (): string => 'https://identity.idoklad.cz/server/connect/authorize';

  public getDescription = (): string => 'Test OAuth2 application';

  public getName = (): string => 'oauth2application';

  public getPublicName = (): string => 'Test OAuth2 Application';

  public getRequestDto = (
    dto: ProcessDto,
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: BodyInit,
  ): RequestDto => new RequestDto(url ?? '', HttpMethods.GET, dto, data);

  public getFormStack = (): FormStack => {
    const label = 'testLabel';
    const fieldClientId = new Field(FieldType.TEXT, CLIENT_ID, label);
    const fieldClientSecret = new Field(FieldType.PASSWORD, CLIENT_SECRET, label);

    const form = new Form(AUTHORIZATION_FORM, 'testPublicName');
    form.addField(fieldClientId);
    form.addField(fieldClientSecret);

    const formStack = new FormStack();
    return formStack.addForm(form);
  };

  public getTokenUrl = (): string => 'https://identity.idoklad.cz/server/connect/token';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getScopes = (applicationInstall: ApplicationInstall): string[] => ['idoklad_api', 'offline_access'];

  protected _getScopesSeparator = (): string => ScopeSeparatorEnum.SPACE;
}
