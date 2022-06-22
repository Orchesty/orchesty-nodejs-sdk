import { BodyInit } from 'node-fetch';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import { ABasicApplication, TOKEN } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import Form from '../../lib/Application/Model/Form/Form';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';
import ProcessDto from '../../lib/Utils/ProcessDto';
import { AUTHORIZATION_FORM } from '../../lib/Application/Base/AApplication';
import FormStack from '../../lib/Application/Model/Form/FormStack';

export default class TestTokenBasicApplication extends ABasicApplication {
  public getDescription = (): string => 'Test description';

  public getName = (): string => 'test';

  public getPublicName = (): string => 'Test application';

  public getFormStack = (): FormStack => {
    const label = 'testToken';
    const fieldToken = new Field(FieldType.TEXT, TOKEN, label);

    const form = new Form(AUTHORIZATION_FORM, 'testPublicName');
    form.addField(fieldToken);

    const formStack = new FormStack();
    return formStack.addForm(form);
  };

  public getRequestDto = (
    dto: ProcessDto,
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: BodyInit,
  ): RequestDto => new RequestDto(url ?? '', method, dto, data);
}
