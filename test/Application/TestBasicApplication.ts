import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import { ABasicApplication } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import Form from '../../lib/Application/Model/Form/Form';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';

export default class TestBasicApplication extends ABasicApplication {
  // eslint-disable-next-line class-methods-use-this
  public syncTestSyncMethod(): string {
    return JSON.stringify({
      param1: 'p1',
      param2: 'p2',
    });
  }

  public getDescription = (): string => 'Test description';

  public getName = (): string => 'test';

  public getPublicName = (): string => 'Test application';

  public getSettingsForm = (): Form => {
    const label = 'testLabel';
    const fieldText = new Field(FieldType.TEXT, 'person', label);
    const field = new Field(FieldType.PASSWORD, 'testKey', label);

    const form = new Form();
    form.addField(field);
    form.addField(fieldText);
    return form;
  };

  public getRequestDto = (
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: string,
  ): RequestDto => new RequestDto(url ?? '', method, data);
}
