import CoreFormsEnum from '../../lib/Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import CustomAction from '../../lib/Application/Model/CustomAction/CustomAction';
import CustomActionType from '../../lib/Application/Model/CustomAction/CustomActionType';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import Form from '../../lib/Application/Model/Form/Form';
import FormStack from '../../lib/Application/Model/Form/FormStack';
import { ABasicApplication, PASSWORD, USER } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import { HttpMethods } from '../../lib/Transport/HttpMethods';
import { CommonHeaders } from '../../lib/Utils/Headers';
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
    public async syncTestSyncMethodVoid(): Promise<void> {
    }

    public syncTestSyncMethodResponse(): Response {
        const res = new Response('plaintext');
        res.headers.append(CommonHeaders.CONTENT_TYPE, 'text/plain');

        return res;
    }

    public getDescription(): string {
        return 'Test description';
    }

    public getName(): string {
        return 'test';
    }

    public getPublicName(): string {
        return 'Test application';
    }

    public getFormStack(): FormStack {
        const label = 'testLabel';

        const fieldText = new Field(FieldType.TEXT, USER, label);
        const field = new Field(FieldType.PASSWORD, PASSWORD, label);

        const form = new Form(CoreFormsEnum.AUTHORIZATION_FORM, 'testPublicName');
        form.addField(field);
        form.addField(fieldText);

        const fieldText1 = new Field(FieldType.TEXT, 'host', label);
        const multi = new Field(FieldType.MULTI_SELECT, 'multi', label);
        const field1 = new Field(FieldType.TEXT, 'database', label);

        const form1 = new Form('testForm', 'testPublicName');
        form1
            .addField(field1)
            .addField(multi)
            .addField(fieldText1);

        const formStack = new FormStack();
        formStack.addForm(form);
        return formStack.addForm(form1);
    }

    public getRequestDto(
        dto: ProcessDto,
        applicationInstall: ApplicationInstall,
        method: HttpMethods,
        url?: string,
        data?: unknown,
    ): RequestDto {
        return new RequestDto(url ?? '', method, dto, data);
    }

    public getCustomActions(): CustomAction[] {
        const action = new CustomAction('testName', CustomActionType.OPEN, { url: 'https://www.google.com/' });

        return [action];
    }

}
