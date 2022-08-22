import { AUTHORIZATION_FORM } from '../../../lib/Application/Base/AApplication';
import ApplicationTypeEnum from '../../../lib/Application/Base/ApplicationTypeEnum';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
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
            [AUTHORIZATION_FORM]: { [PASSWORD]: pass, user },
        };
        appInstall = await app.saveApplicationForms(
            appInstall,
            { [AUTHORIZATION_FORM]: { user, [PASSWORD]: pass, token } },
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

    it('getApplicationForm', () => {
        const app = new TestBasicApplication();
        const appInstall = new ApplicationInstall();
        const sett = { form: { person: user, [PASSWORD]: pass } };
        appInstall.addSettings(sett);
        const res = app.getApplicationForms(appInstall);
        expect(res).toEqual({
            authorization_form: { // eslint-disable-line
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
        });
    });
});
