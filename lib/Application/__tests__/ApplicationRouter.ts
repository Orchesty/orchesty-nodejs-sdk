import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { appInstallConfig, mockOnce } from '../../../test/MockServer';
import {
    closeConnections,
    dropCollection,
    expressApp,
    getApplicationWithSettings,
    getTestContainer,
    NAME,
    USER,
} from '../../../test/TestAbstact';
import { OAuth2Provider } from '../../Authorization/Provider/OAuth2/OAuth2Provider';
import { PASSWORD } from '../../Authorization/Type/Basic/ABasicApplication';
import { orchestyOptions } from '../../Config/Config';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { HttpMethods } from '../../Transport/HttpMethods';
import { encode } from '../../Utils/Base64';
import CoreFormsEnum from '../Base/CoreFormsEnum';
import { IApplication } from '../Base/IApplication';
import { IField } from '../Model/Form/Field';
import assertions from './assertions.json';

describe('Test ApplicationRouter', () => {
    let application: IApplication;
    let oAuthApplication: IApplication;
    let provider: OAuth2Provider;
    let container: DIContainer;
    let dbClient: MongoDbClient;
    let oauthName: string;
    let authorizationURL: string;
    const testName = 'test';

    beforeAll(() => {
        container = getTestContainer();
        application = container.getApplication('test');
        oAuthApplication = container.getApplication('oauth2application');
        provider = container.get(CoreServices.OAUTH2_PROVIDER);
        dbClient = container.get(CoreServices.MONGO);
    });

    beforeEach(async () => {
        await dropCollection();
        const repo = dbClient.getApplicationRepository();
        repo.clearCache();

        oauthName = oAuthApplication.getName();

        authorizationURL = 'example.com';

        Reflect.set(provider, 'createClient', () => ({
            getToken: () => ({
                token: {
                    ok: true, access_token: 'some_token', token_type: '', refresh_token: '', expires_at: '',
                },
            }),
            authorizeURL: () => authorizationURL,
        }));
    });

    afterAll(async () => {
        await closeConnections();
    });

    it('get /applications route', async () => {
        const expectedResult = '{"items":[{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description","info":"","logo":null,"isInstallable":true},{"name":"Test OAuth2 Application","authorization_type":"oauth2","application_type":"cron","key":"oauth2application","description":"Test OAuth2 application","info":"","logo":null,"isInstallable":true},{"name":"Test webhook application","authorization_type":"basic","application_type":"webhook","key":"webhookName","description":"Test webhook description","info":"","logo":null,"isInstallable":false}]}';

        await supertest(expressApp)
            .get('/applications')
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/limits - empty array', async () => {
        await supertest(expressApp)
            .post('/applications/limits')
            .send({ user: USER, applications: [NAME] }).expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toEqual([]);
            });
    });

    it('post /applications/limits', async () => {
        const limiterForm = { [CoreFormsEnum.LIMITER_FORM]: {
            useLimit: true,
            value: 3,
            time: 60,
        } };

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["user"],"keys":["name"],"enabled":null}`,
            },
            response: { body: [getApplicationWithSettings(limiterForm)] },
        }]);

        await supertest(expressApp)
            .post('/applications/limits')
            .send({ user: USER, applications: [NAME] }).expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toEqual([`${USER}|${NAME};60;3`]);
            });
    });

    it('get /applications/:name route', async () => {
        const expectedResult = '{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description","info":"","logo":null,"isInstallable":true}';
        await supertest(expressApp)
            .get(`/applications/${application.getName()}`)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('get /applications/:name/sync/list route', async () => {
        const expectedResult = '["testSyncMethod","testSyncMethodVoid","afterDisableCallback","afterEnableCallback","afterInstallCallback","afterUninstallCallback"]';
        await supertest(expressApp)
            .get(`/applications/${application.getName()}/sync/list`)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/:name/sync/:method route', async () => {
        const method = 'testSyncMethod';
        const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
        await supertest(expressApp)
            .post(`/applications/${application.getName()}/sync/${method}`)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/:name/sync/:method route with void', async () => {
        const method = 'testSyncMethodVoid';
        const expectedResult = '{"status":"ok"}';
        await supertest(expressApp)
            .post(`/applications/${application.getName()}/sync/${method}`)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('get /applications/:name/sync/:method route', async () => {
        const method = 'testSyncMethod';
        const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
        await supertest(expressApp)
            .get(`/applications/${application.getName()}/sync/${method}`)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('throw error on get /applications/:oauthName/users/:user/authorize route cause', async () => {
        await supertest(expressApp)
            .get(`/applications/${application.getName()}/users/${application.getName()}/authorize`)
            .expect(StatusCodes.BAD_REQUEST);
    });

    it('get /applications/:name/users/:user/authorize route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${oauthName}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        await supertest(expressApp)
            .get(`/applications/${oauthName}/users/${USER}/authorize`)
            .query({ redirect_url: 'example.com' })
            .expect(`{"authorizeUrl":"${authorizationURL}&access_type=offline"}`);
    });

    it('get /applications/authorize/token route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${oauthName}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        const state = encode(`${USER}:${oauthName}`); // Base64
        await supertest(expressApp)
            .get('/applications/authorize/token')
            .query({ state })
            .expect(StatusCodes.OK, '{}');
    });

    it('get /applications/:name/users/:user/authorize/token route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${oauthName}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        await supertest(expressApp)
            .get(`/applications/${oauthName}/users/${USER}/authorize/token`)
            .query({ redirect_url: 'example.com' })
            .expect(StatusCodes.OK, '{}');
    });

    it('post /applications/:name/users/:user/install route', async () => {
        const expectedResult = assertions['post /applications/:name/users/:user/install route'];

        await supertest(expressApp)
            .post(`/applications/${testName}/users/${USER}/install`)
            .expect((response) => {
                expect(JSON.parse(response.text)).toEqual(expectedResult);
                expect(response.statusCode).toEqual(StatusCodes.CREATED);
            });
    });

    it('should not allow store /applications/:name/users/:user/install if application already exists', async () => {
        await supertest(expressApp)
            .post(`/applications/${NAME}/users/${USER}/install`)
            .expect(StatusCodes.BAD_REQUEST);
    });

    it('put /applications/:name/users/:user/settings route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${testName}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        await supertest(expressApp)
            .put(`/applications/${testName}/users/${USER}/settings`)
            .send({ data: { key: 'name' } })
            .expect((response) => {
                expect(JSON.parse(response.text).user).toEqual(USER);
                expect(response.statusCode).toEqual(StatusCodes.OK);
            });
    });

    it('put /applications/:name/users/:user/password route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${testName}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        const password = 'pass';
        await supertest(expressApp)
            .put(`/applications/${testName}/users/${USER}/password`)
            .send({ password, formKey: [CoreFormsEnum.AUTHORIZATION_FORM], fieldKey: [PASSWORD] })
            .expect((response) => {
                const jsonResponse = JSON.parse(response.text);
                if (CoreFormsEnum.AUTHORIZATION_FORM in jsonResponse.applicationSettings) {
                    const fieldPassword = (
                        jsonResponse.applicationSettings[CoreFormsEnum.AUTHORIZATION_FORM].fields as IField[]
                    ).find((field) => field.key);
                    expect(fieldPassword?.value).toBeTruthy();
                } else {
                    expect(false).toBeTruthy();
                }
            });
    });

    it('put /applications/:name/users/:user/uninstall route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${NAME}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        await supertest(expressApp)
            .delete(`/applications/${NAME}/users/${USER}/uninstall`)
            .expect((response) => {
                // Todo : There's a decorator that basically force to add delete = false ,await repo.findOne({ key: appName, user: userName , deleted: true });
                expect(response.statusCode).toEqual(StatusCodes.OK);
            });
    });

    it('get /applications/:name/users/:user route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"keys":["${testName}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, testName)] },
        }]);

        await supertest(expressApp)
            .get(`/applications/${testName}/users/${USER}`)
            .expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toHaveProperty('name');
                expect(response.body.key).toEqual('test');
                expect(response.body).toHaveProperty('applicationSettings');
                expect(response.body).toHaveProperty('webhookSettings');
            });
    });

    it('get /applications/users/:user route', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        await supertest(expressApp)
            .get(`/applications/users/${USER}`)
            .expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toHaveProperty('items');
                expect(response.body.items).toHaveLength(1);
            });
    });
});
