import { BodyInit } from 'node-fetch';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import { ABasicApplication, PASSWORD } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import Form from '../../lib/Application/Model/Form/Form';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestBasicApplication extends ABasicApplication {
  // eslint-disable-next-line class-methods-use-this
  public syncTestSyncMethod(): string {
    return JSON.stringify({
      param1: 'p1',
      param2: 'p2',
    });
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public async syncTestSyncMethodVoid(): Promise<void> {}

  public getDescription = (): string => 'Test description';

  public getName = (): string => 'test';

  public getPublicName = (): string => 'Test application';

  public getSettingsForm = (): Form => {
    const label = 'testLabel';
    const fieldText = new Field(FieldType.TEXT, 'person', label);
    const field = new Field(FieldType.PASSWORD, PASSWORD, label);

    const form = new Form();
    form.addField(field);
    form.addField(fieldText);
    return form;
  };

  public getRequestDto = (
    dto: ProcessDto,
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: BodyInit,
  ): RequestDto => new RequestDto(url ?? '', method, dto, data);
}
