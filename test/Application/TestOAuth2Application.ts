import CoreFormsEnum from '../../lib/Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import Field from '../../lib/Application/Model/Form/Field';
import FieldType from '../../lib/Application/Model/Form/FieldType';
import Form from '../../lib/Application/Model/Form/Form';
import FormStack from '../../lib/Application/Model/Form/FormStack';
import ScopeSeparatorEnum from '../../lib/Authorization/ScopeSeparatorEnum';
import AOAuth2Application from '../../lib/Authorization/Type/OAuth2/AOAuth2Application';
import { CLIENT_ID, CLIENT_SECRET } from '../../lib/Authorization/Type/OAuth2/IOAuth2Application';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import { HttpMethods } from '../../lib/Transport/HttpMethods';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestOAuth2Application extends AOAuth2Application {

    public getAuthUrl(): string {
        return 'https://identity.idoklad.cz/server/connect/authorize';
    }

    public getDescription(): string {
        return 'Test OAuth2 application';
    }

    public getName(): string {
        return 'oauth2application';
    }

    public getPublicName(): string {
        return 'Test OAuth2 Application';
    }

    public getRequestDto(
        dto: ProcessDto,
        applicationInstall: ApplicationInstall,
        method: HttpMethods,
        url?: string,
        data?: unknown,
    ): RequestDto {
        return new RequestDto(url ?? '', HttpMethods.GET, dto, data);
    }

    public getFormStack(): FormStack {
        const label = 'testLabel';
        const fieldClientId = new Field(FieldType.TEXT, CLIENT_ID, label);
        const fieldClientSecret = new Field(FieldType.PASSWORD, CLIENT_SECRET, label);

        const form = new Form(CoreFormsEnum.AUTHORIZATION_FORM, 'testPublicName');
        form.addField(fieldClientId);
        form.addField(fieldClientSecret);

        const formStack = new FormStack();
        return formStack.addForm(form);
    }

    public getTokenUrl(): string {
        return 'https://identity.idoklad.cz/server/connect/token';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getScopes(applicationInstall: ApplicationInstall): string[] {
        return ['idoklad_api', 'offline_access'];
    }

    protected getScopesSeparator(): string {
        return ScopeSeparatorEnum.SPACE;
    }

}
