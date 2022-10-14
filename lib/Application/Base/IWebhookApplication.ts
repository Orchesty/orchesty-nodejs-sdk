import RequestDto from '../../Transport/Curl/RequestDto';
import ResponseDto from '../../Transport/Curl/ResponseDto';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import Webhook from '../Database/Webhook';
import WebhookSubscription from '../Model/Webhook/WebhookSubscription';
import { IApplication } from './IApplication';

export interface IWebhookApplication extends IApplication {

    getWebhookSubscriptions(): WebhookSubscription[];

    getWebhookSubscribeRequestDto(
        applicationInstall: ApplicationInstall,
        subscription: WebhookSubscription,
        url: string,
    ): RequestDto;

    getWebhookUnsubscribeRequestDto(
        applicationInstall: ApplicationInstall,
        webhook: Webhook,
    ): RequestDto;

    processWebhookSubscribeResponse(dto: ResponseDto, applicationInstall: ApplicationInstall): string;

    processWebhookUnsubscribeResponse(dto: ResponseDto): boolean;

}
