import { Headers } from 'node-fetch';
import TestWebhookApplication from '../TestWebhookApplication';
import HttpMethods from '../../../lib/Transport/HttpMethods';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import { ApplicationInstall } from '../../../lib/Application/Database/ApplicationInstall';
import RequestDto from '../../../lib/Transport/Curl/RequestDto';
import WebhookSubscription from '../../../lib/Application/Model/Webhook/WebhookSubscription';
import ResponseDto from '../../../lib/Transport/Curl/ResponseDto';

let app: TestWebhookApplication;

describe('Tests for webhook application', () => {
  beforeEach(() => {
    app = new TestWebhookApplication();
  });

  it('getRequestDto', () => {
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

  it('getSettingsForm', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const expected = {
      _forms: [
        {
          _description: '',
          _fields: [
            {
              _choices: [],
              _description: '',
              _disabled: false,
              _key: 'testKey',
              _label: 'testLabel',
              _readOnly: false,
              _required: false,
              _type: 'password',
              _value: null,
            },
            {
              _choices: [],
              _description: '',
              _disabled: false,
              _key: 'person',
              _label: 'testLabel',
              _readOnly: false,
              _required: false,
              _type: 'text',
              _value: null,
            },
          ],
          _key: 'testKey',
          _publicName: 'testPublicName',
        },
      ],
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    expect(app.getFormStack()).toEqual(expected);
  });

  it('getWebhookSubscribeRequestDto', () => {
    const subscription = new WebhookSubscription('SubName', 'SubNode', 'SubTopology');
    const urlValue = 'https://www.google.com';
    const requestDto = app.getWebhookSubscribeRequestDto(new ApplicationInstall(), subscription, urlValue);
    expect(requestDto).toBeInstanceOf(RequestDto);
    expect(requestDto).toHaveProperty('_url', urlValue);
    expect(requestDto).toHaveProperty('_method', HttpMethods.GET);
  });

  it('getWebhookUnsubscribeRequestDto', () => {
    const requestDto = app.getWebhookUnsubscribeRequestDto(new ApplicationInstall(), '1');
    expect(requestDto).toBeInstanceOf(RequestDto);
    expect(requestDto).toHaveProperty('_url', 'unknown/url');
    expect(requestDto).toHaveProperty('_method', HttpMethods.DELETE);
  });

  it('processWebhookSubscribeResponse', () => {
    const processResponse = app.processWebhookSubscribeResponse(new ResponseDto(
      JSON.stringify({ id: '1' }),
      200,
      new Headers(),
    ), new ApplicationInstall());
    expect(processResponse).toBe('1');
  });

  it('processWebhookUnsubscribeResponse', () => {
    const processResponse = app.processWebhookUnsubscribeResponse(new ResponseDto(
      JSON.stringify({ id: '1' }),
      200,
      new Headers(),
    ));
    expect(processResponse).toBeTruthy();
  });
});
