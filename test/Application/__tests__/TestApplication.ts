/* eslint-disable @typescript-eslint/naming-convention */
import TestBasicApplication from '../TestBasicApplication';
import HttpMethods from '../../../lib/Transport/HttpMethods';
import RequestDto from '../../../lib/Transport/Curl/RequestDto';
import ApplicationTypeEnum from '../../../lib/Application/Base/ApplicationTypeEnum';
import AuthorizationTypeEnum from '../../../lib/Authorization/AuthorizationTypeEnum';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import ProcessDto from '../../../lib/Utils/ProcessDto';

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
      application_type: ApplicationTypeEnum.CRON,
      authorization_type: AuthorizationTypeEnum.BASIC,
      description: 'Test description',
      key: 'test',
      name: 'Test application',
      logo: null,
    });
  });

  it('getSettingsForm', () => {
    const app = new TestBasicApplication();
    const expected = {
      _fields: [
        {
          _choices: [],
          _description: '',
          _key: 'testKey',
          _label: 'testLabel',
          _type: 'password',
          _value: null,
          _disabled: false,
          _readOnly: false,
          _required: false,
        },
        {
          _choices: [],
          _description: '',
          _key: 'person',
          _label: 'testLabel',
          _type: 'text',
          _value: null,
          _disabled: false,
          _readOnly: false,
          _required: false,
        },
      ],
    };
    expect(app.getSettingsForm()).toEqual(expected);
  });

  it('setApplicationSettings', async () => {
    const app = new TestBasicApplication();
    let appInstall = new ApplicationInstall();
    const expected = {
      authorization_settings: {
        password: pass,
        token,
        user,
      },
    };
    appInstall = await app.setApplicationSettings(appInstall, { form: { user, password: pass, token } });
    expect(appInstall.getSettings()).toEqual(expected);
  });

  it('setApplicationSettingsAddPerson', async () => {
    const app = new TestBasicApplication();
    let appInstall = new ApplicationInstall();
    const expected = {
      form: {
        person: 'test',
      },
    };
    appInstall = await app.setApplicationSettings(appInstall, { person: 'test' });
    expect(appInstall.getSettings()).toEqual(expected);
  });

  it('getApplicationForm', async () => {
    const app = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    const sett = { form: { user, password: pass, token } };
    const result = await app.setApplicationSettings(appInstall, sett);
    expect(result).toBeInstanceOf(ApplicationInstall);
    const resultSett = result.getSettings();
    expect(resultSett).toHaveProperty('authorization_settings');
    expect(result.getSettings().authorization_settings.user).toEqual(user);
    expect(result.getSettings().authorization_settings.password).toEqual(pass);
    expect(result.getSettings().authorization_settings.token).toEqual(token);
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
    expect(requestDto).toHaveProperty('_url', urlValue);
    expect(requestDto).toHaveProperty('_method', method);
    expect(requestDto).toHaveProperty('_body', data);

    const requestDtoWithoutUrl = app.getRequestDto(new ProcessDto(), new ApplicationInstall(), method);
    expect(requestDtoWithoutUrl).toHaveProperty('_url', '');
  });

  it('getApplicationForm', () => {
    const app = new TestBasicApplication();
    const appInstall = new ApplicationInstall();
    const sett = { form: { person: user, testKey: pass } };
    appInstall.addSettings(sett);
    const res = app.getApplicationForm(appInstall);
    expect(res).toEqual(
      [
        {
          choices: [],
          description: '',
          disabled: false,
          key: 'testKey',
          label: 'testLabel',
          readOnly: false,
          required: false,
          type: 'password',
          value: true,
        },
        {
          choices: [],
          description: '',
          disabled: false,
          key: 'person',
          label: 'testLabel',
          readOnly: false,
          required: false,
          type: 'text',
          value: 'Jakub',
        },
      ],
    );
  });
});
