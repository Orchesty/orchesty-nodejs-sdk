import { IApplication } from './IApplication';
import RequestDto from '../../Transport/Curl/RequestDto';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import WebhookSubscription from '../Model/Webhook/WebhookSubscription';

export interface IWebhookApplication extends IApplication {

  getWebhookSubscriptions(): string[];

  getWebhookSubscribeRequestDto(
    applicationInstall: ApplicationInstall,
    subscription: WebhookSubscription,
    url: string,
  ): RequestDto;

  getWebhookUnsubscribeRequestDto(applicationInstall: ApplicationInstall, id: string): RequestDto;

  processWebhookSubscribeResponse(dto: RequestDto, applicationInstall: ApplicationInstall): string;

  processWebhookUnsubscribeResponse(dto: RequestDto): boolean;

}
