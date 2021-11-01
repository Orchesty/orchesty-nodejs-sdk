import { IApplication } from './IApplication';
import RequestDto from '../../Transport/Curl/RequestDto';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import WebhookSubscription from '../Model/Webhook/WebhookSubscription';
import ResponseDto from '../../Transport/Curl/ResponseDto';

export interface IWebhookApplication extends IApplication {

  getWebhookSubscriptions(): WebhookSubscription[];

  getWebhookSubscribeRequestDto(
    applicationInstall: ApplicationInstall,
    subscription: WebhookSubscription,
    url: string,
  ): RequestDto;

  getWebhookUnsubscribeRequestDto(applicationInstall: ApplicationInstall, id: string): RequestDto;

  processWebhookSubscribeResponse(dto: ResponseDto, applicationInstall: ApplicationInstall): string;

  processWebhookUnsubscribeResponse(dto: ResponseDto): boolean;

}
