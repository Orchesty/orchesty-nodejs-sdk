import { BodyInit } from 'node-fetch';
import CoreFormsEnum from '../../lib/Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import Form from '../../lib/Application/Model/Form/Form';
import FormStack from '../../lib/Application/Model/Form/FormStack';
import { ABasicApplication, TOKEN } from '../../lib/Authorization/Type/Basic/ABasicApplication';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import { HttpMethods } from '../../lib/Transport/HttpMethods';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestTokenBasicApplication extends ABasicApplication {

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
        const label = 'testToken';
        const fieldToken = new Field(FieldType.TEXT, TOKEN, label);

        const form = new Form(CoreFormsEnum.AUTHORIZATION_FORM, 'testPublicName');
        form.addField(fieldToken);

        const formStack = new FormStack();
        return formStack.addForm(form);
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

}
