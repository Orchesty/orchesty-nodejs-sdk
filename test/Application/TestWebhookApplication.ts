import { BodyInit } from 'node-fetch';
import { IWebhookApplication } from '../../lib/Application/Base/IWebhookApplication';
import { ABasicApplication } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import ProcessDto from '../../lib/Utils/ProcessDto';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import HttpMethods from '../../lib/Transport/HttpMethods';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import Form from '../../lib/Application/Model/Form/Form';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import WebhookSubscription from '../../lib/Application/Model/Webhook/WebhookSubscription';
import ResponseDto from '../../lib/Transport/Curl/ResponseDto';
import ApplicationTypeEnum from '../../lib/Application/Base/ApplicationTypeEnum';
import FormStack from '../../lib/Application/Model/Form/FormStack';

export default class TestWebhookApplication extends ABasicApplication implements IWebhookApplication {
  public getDescription = (): string => 'Test webhook description';

  public getName = (): string => 'webhookName';

  public getPublicName = (): string => 'Test webhook application';

  public getApplicationType = (): ApplicationTypeEnum => ApplicationTypeEnum.WEBHOOK;

  public getRequestDto = (
    dto: ProcessDto,
    applicationInstall: ApplicationInstall,
    method: HttpMethods,
    url?: string,
    data?: BodyInit,
  ): RequestDto => new RequestDto(url ?? '', method, dto, data);

  public getFormStack = (): FormStack => {
    const label = 'testLabel';
    const fieldText = new Field(FieldType.TEXT, 'person', label);
    const field = new Field(FieldType.PASSWORD, 'testKey', label);

    const form = new Form('testKey', 'testPublicName');
    form.addField(field);
    form.addField(fieldText);

    const formStack = new FormStack();
    return formStack.addForm(form);
  };

  public getWebhookSubscribeRequestDto = (
    applicationInstall: ApplicationInstall,
    subscription: WebhookSubscription,
    url: string,
  ): RequestDto => new RequestDto(url, HttpMethods.GET, new ProcessDto());

  public getWebhookSubscriptions = (): WebhookSubscription[] => [
    new WebhookSubscription('testWebhook', 'testNode', 'testWebhook'),
  ];

  public getWebhookUnsubscribeRequestDto = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applicationInstall: ApplicationInstall,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: string,
  ): RequestDto => new RequestDto('unknown/url', HttpMethods.DELETE, new ProcessDto());

  public processWebhookSubscribeResponse = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto: ResponseDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applicationInstall: ApplicationInstall,
  ): string => (dto.jsonBody as {id: string}).id;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public processWebhookUnsubscribeResponse = (dto: ResponseDto): boolean => true;
}
