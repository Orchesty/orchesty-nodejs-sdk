import OAuth2ApplicationAbstract from "../../lib/Authorization/Type/OAuth2/OAuth2ApplicationAbstract";
import {ApplicationInstall} from "../../lib/Application/Database/ApplicationInstall";
import Form from "../../lib/Application/Model/Form/Form";
import RequestDto from "../../lib/Transport/Curl/RequestDto";
import Field from "../../lib/Application/Model/Form/Field";
import FieldType from "../../lib/Application/Model/Form/FieldType";
import HttpMethods from "../../lib/Transport/HttpMethods";
import {CLIENT_ID, CLIENT_SECRET} from "../../lib/Authorization/Type/OAuth2/IOAuth2Application";
import ScopeSeparatorEnum from "../../lib/Authorization/ScopeSeparatorEnum";

export default class TestOAuth2Application extends OAuth2ApplicationAbstract {

  public getAuthUrl(): string {
    return 'https://identity.idoklad.cz/server/connect/authorize';
  }

  public getDescription(): string {
    return 'Test OAuth2 application';
  }

  public getName(): string {
    return 'oauth2application';
  }

  public getPublicName(): string {
    return 'Test OAuth2 Application';
  }

  public getRequestDto(applicationInstall: ApplicationInstall, method: HttpMethods, url?: string, data?: string): RequestDto {
    return new RequestDto(url ?? '', HttpMethods.GET, data);
  }

  public getSettingsForm(): Form {
    const label = 'testLabel';
    const fieldClientId = new Field(FieldType.TEXT, CLIENT_ID, label);
    const fieldClientSecret = new Field(FieldType.PASSWORD, CLIENT_SECRET, label);

    const form = new Form();
    form.addField(fieldClientId);
    form.addField(fieldClientSecret);
    return form;
  }

  public getTokenUrl(): string {
    return 'https://identity.idoklad.cz/server/connect/token';
  }

  public getScopes(applicationInstall: ApplicationInstall): string[] {
    return ['idoklad_api', 'offline_access'];
  }

  protected _getScopesSeparator(): string {
    return ScopeSeparatorEnum.SPACE;
  }

}
