import { BodyInit } from 'node-fetch';
import ApplicationTypeEnum from '../../lib/Application/Base/ApplicationTypeEnum';
import { IWebhookApplication } from '../../lib/Application/Base/IWebhookApplication';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import Form from '../../lib/Application/Model/Form/Form';
import FormStack from '../../lib/Application/Model/Form/FormStack';
import WebhookSubscription from '../../lib/Application/Model/Webhook/WebhookSubscription';
import { ABasicApplication } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import ResponseDto from '../../lib/Transport/Curl/ResponseDto';
import { HttpMethods } from '../../lib/Transport/HttpMethods';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestWebhookApplication extends ABasicApplication implements IWebhookApplication {

    protected isInstallable = false;

    public getDescription(): string {
        return 'Test webhook description';
    }

    public getName(): string {
        return 'webhookName';
    }

    public getPublicName(): string {
        return 'Test webhook application';
    }

    public getApplicationType(): ApplicationTypeEnum {
        return ApplicationTypeEnum.WEBHOOK;
    }

    public getRequestDto(
        dto: ProcessDto,
        applicationInstall: ApplicationInstall,
        method: HttpMethods,
        url?: string,
        data?: BodyInit,
    ): RequestDto {
        return new RequestDto(url ?? '', method, dto, data);
    }

    public getFormStack(): FormStack {
        const label = 'testLabel';
        const fieldText = new Field(FieldType.TEXT, 'person', label);
        const field = new Field(FieldType.PASSWORD, 'testKey', label);

        const form = new Form('testKey', 'testPublicName');
        form.addField(field);
        form.addField(fieldText);

        const formStack = new FormStack();
        return formStack.addForm(form);
    }

    public getWebhookSubscribeRequestDto(
        applicationInstall: ApplicationInstall,
        subscription: WebhookSubscription,
        url: string,
    ): RequestDto {
        return new RequestDto(url, HttpMethods.GET, new ProcessDto());
    }

    public getWebhookSubscriptions(): WebhookSubscription[] {
        return [
            new WebhookSubscription('testWebhook', 'testNode', 'testWebhook'),
        ];
    }

    public getWebhookUnsubscribeRequestDto(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        applicationInstall: ApplicationInstall,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        id: string,
    ): RequestDto {
        return new RequestDto('unknown/url', HttpMethods.DELETE, new ProcessDto());
    }

    public processWebhookSubscribeResponse(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        dto: ResponseDto,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        applicationInstall: ApplicationInstall,
    ): string {
        return (dto.getJsonBody() as { id: string }).id;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public processWebhookUnsubscribeResponse(dto: ResponseDto): boolean {
        return true;
    }

}
