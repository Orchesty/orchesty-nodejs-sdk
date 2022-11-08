import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { closeConnections, dropCollection, expressApp, getTestContainer } from '../../../test/TestAbstact';
import { OAuth2Provider } from '../../Authorization/Provider/OAuth2/OAuth2Provider';
import { PASSWORD } from '../../Authorization/Type/Basic/ABasicApplication';
import { CLIENT_ID } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import { encode } from '../../Utils/Base64';
import CoreFormsEnum from '../Base/CoreFormsEnum';
import { IApplication } from '../Base/IApplication';
import { ApplicationInstall } from '../Database/ApplicationInstall';
import { IField } from '../Model/Form/Field';
import assertions from './assertions.json';

describe('Test ApplicationRouter', () => {
    let application: IApplication;
    let oAuthApplication: IApplication;
    let provider: OAuth2Provider;
    let container: DIContainer;
    let dbClient: MongoDbClient;
    let appInstall: ApplicationInstall;
    let name: string;
    let user: string;
    let authorizationURL: string;

    beforeAll(async () => {
        container = await getTestContainer();
        application = container.getApplication('test');
        oAuthApplication = container.getApplication('oauth2application');
        provider = container.get(CoreServices.OAUTH2_PROVIDER);
        dbClient = container.get(CoreServices.MONGO);
    });

    beforeEach(async () => {
        await dropCollection(ApplicationInstall.getCollection());
        const repo = await dbClient.getApplicationRepository();

        user = 'user';
        name = oAuthApplication.getName();

        authorizationURL = 'example.com';

        appInstall = new ApplicationInstall()
            .setEnabled(true)
            .setUser(user)
            .setName(name);
        appInstall.setSettings({
            [CoreFormsEnum.AUTHORIZATION_FORM]: {
                [CLIENT_ID]: 'client id 1',
            },
        });

        await repo.insert(appInstall);
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
        const applicationUrl = '/applications';
        const expectedResult = '{"items":[{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description","info":"","logo":null,"isInstallable":true},{"name":"Test OAuth2 Application","authorization_type":"oauth2","application_type":"cron","key":"oauth2application","description":"Test OAuth2 application","info":"","logo":null,"isInstallable":true},{"name":"Test webhook application","authorization_type":"basic","application_type":"webhook","key":"webhookName","description":"Test webhook description","info":"","logo":null,"isInstallable":false}]}';

        await supertest(expressApp)
            .get(applicationUrl)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/limits - empty array', async () => {
        const repo = await dbClient.getRepository(ApplicationInstall);
        const appName = 'test';
        const userName = 'abcUsername';
        appInstall = new ApplicationInstall()
            .setUser(userName)
            .setName(appName);
        await repo.insert(appInstall);
        const applicationUrl = '/applications/limits';
        await supertest(expressApp)
            .post(applicationUrl)
            .send({ user: userName, applications: [appName] }).expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toEqual([]);
            });
    });

    it('post /applications/limits', async () => {
        const repo = await dbClient.getRepository(ApplicationInstall);
        const appName = 'test';
        const userName = 'abcUsername';
        appInstall = new ApplicationInstall()
            .setUser(userName)
            .setName(appName)
            .setSettings({ [CoreFormsEnum.LIMITER_FORM]: {
                useLimit: true,
                value: 3,
                time: 60,
            } });
        await repo.insert(appInstall);
        const applicationUrl = '/applications/limits';
        await supertest(expressApp)
            .post(applicationUrl)
            .send({ user: userName, applications: [appName] }).expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toEqual(['abcUsername|test;60;3']);
            });
    });

    it('get /applications/:name route', async () => {
        const applicationUrl = `/applications/${application.getName()}`;
        // eslint-disable-next-line max-len
        const expectedResult = '{"name":"Test application","authorization_type":"basic","application_type":"cron","key":"test","description":"Test description","info":"","logo":null,"isInstallable":true}';
        await supertest(expressApp)
            .get(applicationUrl)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('get /applications/:name/sync/list route', async () => {
        const applicationUrl = `/applications/${application.getName()}/sync/list`;
        // eslint-disable-next-line max-len
        const expectedResult = '["testSyncMethod","testSyncMethodVoid","afterDisableCallback","afterEnableCallback","afterInstallCallback","afterUninstallCallback"]';
        await supertest(expressApp)
            .get(applicationUrl)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/:name/sync/:method route', async () => {
        const method = 'testSyncMethod';
        const applicationUrl = `/applications/${application.getName()}/sync/${method}`;
        const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
        await supertest(expressApp)
            .post(applicationUrl)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/:name/sync/:method route with void', async () => {
        const method = 'testSyncMethodVoid';
        const applicationUrl = `/applications/${application.getName()}/sync/${method}`;
        const expectedResult = '{"status":"ok"}';
        await supertest(expressApp)
            .post(applicationUrl)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('get /applications/:name/sync/:method route', async () => {
        const method = 'testSyncMethod';
        const applicationUrl = `/applications/${application.getName()}/sync/${method}`;
        const expectedResult = '"{\\"param1\\":\\"p1\\",\\"param2\\":\\"p2\\"}"';
        await supertest(expressApp)
            .get(applicationUrl)
            .expect(StatusCodes.OK, expectedResult);
    });

    it('throw error on get /applications/:name/users/:user/authorize route cause', async () => {
        const applicationUrl = `/applications/${application.getName()}/users/${application.getName()}/authorize`;
        await supertest(expressApp)
            .get(applicationUrl)
            .expect(StatusCodes.BAD_REQUEST);
    });

    it('get /applications/:name/users/:user/authorize route', async () => {
        const applicationUrl = `/applications/${name}/users/${user}/authorize`;
        const expectedResult = `{"authorizeUrl":"${authorizationURL}&access_type=offline"}`;
        await supertest(expressApp)
            .get(applicationUrl)
            .query({ redirect_url: 'example.com' })
            .expect(expectedResult);
    });

    it('get /applications/authorize/token route', async () => {
        const applicationUrl = '/applications/authorize/token';
        const expectedResult = '{}';
        const state = encode(`${user}:${name}`); // Base64
        await supertest(expressApp)
            .get(applicationUrl)
            .query({ state })
            .expect(StatusCodes.OK, expectedResult);
    });

    it('get /applications/:name/users/:user/authorize/token route', async () => {
        const redirectUrl = 'example.com';
        const applicationUrl = `/applications/${name}/users/${user}/authorize/token`;
        const expectedResult = '{}';

        await supertest(expressApp)
            .get(applicationUrl)
            .query({ redirect_url: redirectUrl })
            .expect(StatusCodes.OK, expectedResult);
    });

    it('post /applications/:name/users/:user/install route', async () => {
        const newUser = 'user';
        const appName = 'test';
        const applicationUrl = `/applications/${appName}/users/${newUser}/install`;
        const expectedResult = assertions['post /applications/:name/users/:user/install route'];

        await supertest(expressApp)
            .post(applicationUrl)
            .expect((response) => {
                expect(JSON.parse(response.text)).toEqual(expectedResult);
                expect(response.statusCode).toEqual(StatusCodes.CREATED);
            });
    });

    it('should not allow store /applications/:name/users/:user/install if application already exists', async () => {
        const repo = await dbClient.getApplicationRepository();
        const appName = 'test';
        const userName = 'user';
        appInstall = new ApplicationInstall()
            .setEnabled(true)
            .setUser(userName)
            .setName(appName);

        await repo.insert(appInstall);
        const applicationUrl = `/applications/${appName}/users/${userName}/install`;
        await supertest(expressApp)
            .post(applicationUrl)
            .expect(StatusCodes.BAD_REQUEST);
    });

    it('put /applications/:name/users/:user/settings route', async () => {
        const repo = await dbClient.getApplicationRepository();
        const appName = 'test';
        const userName = 'user';
        appInstall = new ApplicationInstall()
            .setEnabled(true)
            .setUser(userName)
            .setName(appName);
        await repo.insert(appInstall);
        const applicationUrl = `/applications/${appName}/users/${userName}/settings`;

        await supertest(expressApp)
            .put(applicationUrl)
            .send({ data: { key: 'name' } })
            .expect((response) => {
                expect(JSON.parse(response.text).user).toEqual(userName);
                expect(response.statusCode).toEqual(StatusCodes.OK);
            });
    });

    it('put /applications/:name/users/:user/password route', async () => {
        const repo = await dbClient.getApplicationRepository();
        const appName = 'test';
        const userName = 'user';
        appInstall = new ApplicationInstall()
            .setEnabled(true)
            .setUser(userName)
            .setName(appName);
        await repo.insert(appInstall);
        const applicationUrl = `/applications/${appName}/users/${userName}/password`;
        const password = 'pass';
        await supertest(expressApp)
            .put(applicationUrl)
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
        const repo = await dbClient.getApplicationRepository();
        const appName = 'test';
        const userName = 'user';
        appInstall = new ApplicationInstall()
            .setEnabled(true)
            .setUser(userName)
            .setName(appName);
        await repo.insert(appInstall);

        const applicationUrl = `/applications/${appName}/users/${userName}/uninstall`;
        await supertest(expressApp)
            .delete(applicationUrl)
            .expect((response) => {
                // Todo : There's a decorator that basically force to add delete = false ,await repo.findOne({ key: appName, user: userName , deleted: true });
                expect(response.statusCode).toEqual(StatusCodes.OK);
            });
    });

    it('get /applications/:name/users/:user route', async () => {
        const repo = await dbClient.getApplicationRepository();
        const appName = 'test';
        const userName = 'user';
        appInstall = new ApplicationInstall()
            .setEnabled(true)
            .setUser(userName)
            .setName(appName);
        await repo.insert(appInstall);
        const applicationUrl = `/applications/${appName}/users/${userName}`;
        await supertest(expressApp)
            .get(applicationUrl)
            .send({ name: userName, user: userName }).expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toHaveProperty('name');
                expect(response.body.key).toEqual('test');
                expect(response.body).toHaveProperty('applicationSettings');
                expect(response.body).toHaveProperty('webhookSettings');
            });
    });

    it('get /applications/users/:user route', async () => {
        const repo = await dbClient.getApplicationRepository();
        const appName = 'test';
        const userName = 'abcUsername';
        appInstall = new ApplicationInstall()
            .setUser(userName)
            .setName(appName);
        await repo.insert(appInstall);
        const applicationUrl = `/applications/users/${userName}`;
        await supertest(expressApp)
            .get(applicationUrl)
            .send({ name: userName, user: userName }).expect((response) => {
                expect(response.statusCode).toEqual(StatusCodes.OK);
                expect(response.body).toHaveProperty('items');
                expect(response.body.items).toHaveLength(1);
            });
    });
});
