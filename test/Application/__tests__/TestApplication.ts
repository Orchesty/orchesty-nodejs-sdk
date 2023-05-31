import ApplicationTypeEnum from '../../../lib/Application/Base/ApplicationTypeEnum';
import CoreFormsEnum from '../../../lib/Application/Base/CoreFormsEnum';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import CustomActionType from '../../../lib/Application/Model/CustomAction/CustomActionType';
import AuthorizationTypeEnum from '../../../lib/Authorization/AuthorizationTypeEnum';
import { PASSWORD } from '../../../lib/Authorization/Type/Basic/ABasicApplication';
import RequestDto from '../../../lib/Transport/Curl/RequestDto';
import { HttpMethods } from '../../../lib/Transport/HttpMethods';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import TestBasicApplication from '../TestBasicApplication';

describe('Test application', () => {
    const user = 'Jakub';
    const pass = 'passs';
    const token = 'tokenn';

    it('getDescription', () => {
        const app = new TestBasicApplication();
        expect(app.getDescription()).toEqual('Test description');
    });

    it('getPublicName', () => {
        const app = new TestBasicApplication();
        expect(app.getPublicName()).toEqual('Test application');
    });

    it('getName', () => {
        const app = new TestBasicApplication();
        expect(app.getName()).toEqual('test');
    });

    it('getLogo', () => {
        const app = new TestBasicApplication();
        expect(app.getLogo() === null).toBeTruthy();
    });

    it('toArray', () => {
        const app = new TestBasicApplication();
        expect(app.toArray()).toEqual({
            application_type: ApplicationTypeEnum.CRON, // eslint-disable-line
            authorization_type: AuthorizationTypeEnum.BASIC, // eslint-disable-line
            description: 'Test description',
            info: '',
            isInstallable: true,
            key: 'test',
            name: 'Test application',
            logo: null,
        });
    });

    it('getSettingsForm', () => {
        const app = new TestBasicApplication();
        const expected = {
            forms: [
                {
                    description: '',
                    readOnly: false,
                    fields: [
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'password',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'password',
                            value: null,
                        },
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'user',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'text',
                            value: null,
                        },
                    ],
                    key: 'authorization_form',
                    publicName: 'testPublicName',
                },
                {
                    description: '',
                    readOnly: false,
                    fields: [
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'database',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'text',
                            value: null,
                        },
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'multi',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'multiselect',
                            value: null,
                        },
                        {
                            choices: [],
                            description: '',
                            disabled: false,
                            key: 'host',
                            label: 'testLabel',
                            readOnly: false,
                            required: false,
                            type: 'text',
                            value: null,
                        },
                    ],
                    key: 'testForm',
                    publicName: 'testPublicName',
                },
            ],
        };
        expect(app.getFormStack()).toEqual(expected);
    });

    it('setApplicationSettings', async () => {
        const app = new TestBasicApplication();
        let appInstall = new ApplicationInstall();
        const expected = {
            [CoreFormsEnum.AUTHORIZATION_FORM]: { [PASSWORD]: pass, user },
        };
        appInstall = await app.saveApplicationForms(
            appInstall,
            { [CoreFormsEnum.AUTHORIZATION_FORM]: { user, [PASSWORD]: pass, token } },
        );
        expect(appInstall.getSettings()).toEqual(expected);
    });

    it('getUri', () => {
        const app = new TestBasicApplication();
        expect(app.getUri('https://www.google.com')).toBeInstanceOf(URL);
    });

    it('getRequestDto', () => {
        const app = new TestBasicApplication();
        const urlValue = 'https://www.google.com';
        const data = JSON.stringify({ test: 'testData' });
        const method = HttpMethods.POST;
        const requestDto = app.getRequestDto(new ProcessDto(), new ApplicationInstall(), method, urlValue, data);
        expect(requestDto).toBeInstanceOf(RequestDto);
        expect(requestDto).toHaveProperty('url', urlValue);
        expect(requestDto).toHaveProperty('method', method);
        expect(requestDto).toHaveProperty('body', data);

        const requestDtoWithoutUrl = app.getRequestDto(new ProcessDto(), new ApplicationInstall(), method);
        expect(requestDtoWithoutUrl).toHaveProperty('url', '');
    });

    it('getApplicationForm', async () => {
        const app = new TestBasicApplication();
        const appInstall = new ApplicationInstall();
        const sett = { form: { person: user, [PASSWORD]: pass } };
        appInstall.addSettings(sett);
        const res = await app.getApplicationForms(appInstall);
        expect(res).toEqual({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            authorization_form: {
                description: '',
                fields: [
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'password',
                        label: 'testLabel',
                        readOnly: false,
                        required: false,
                        type: 'password',
                        value: null,
                    },
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'user',
                        label: 'testLabel',
                        readOnly: false,
                        required: false,
                        type: 'text',
                        value: null,
                    },
                ],
                key: 'authorization_form',
                publicName: 'testPublicName',
                readOnly: false,
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            limiter_form: {
                description: '',
                fields: [
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'useLimit',
                        label: 'Use limit',
                        readOnly: false,
                        required: false,
                        type: 'checkbox',
                        value: false,
                    },
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'value',
                        label: 'Limit per time',
                        readOnly: false,
                        required: false,
                        type: 'number',
                        value: null,
                    },
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'time',
                        label: 'Time in seconds',
                        readOnly: false,
                        required: false,
                        type: 'number',
                        value: null,
                    },
                ],
                key: 'limiter_form',
                publicName: 'Limiter',
                readOnly: false,
            },
            testForm: {
                description: '',
                fields: [
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'database',
                        label: 'testLabel',
                        readOnly: false,
                        required: false,
                        type: 'text',
                        value: null,
                    },
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'multi',
                        label: 'testLabel',
                        readOnly: false,
                        required: false,
                        type: 'multiselect',
                        value: null,
                    },
                    {
                        choices: [],
                        description: '',
                        disabled: false,
                        key: 'host',
                        label: 'testLabel',
                        readOnly: false,
                        required: false,
                        type: 'text',
                        value: null,
                    },
                ],
                key: 'testForm',
                publicName: 'testPublicName',
                readOnly: false,
            },
        });
    });

    it('getApplicationCustomAction', () => {
        const app = new TestBasicApplication();

        expect(app.getCustomActions()).toEqual([
            {
                name: 'testName',
                action: CustomActionType.OPEN,
                url: 'https://www.google.com/',
            },
        ]);
    });
});
