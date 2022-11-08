import { StatusCodes } from 'http-status-codes';
import { Db } from 'mongodb';
import supertest from 'supertest';
import { expressApp, getTestContainer } from '../../../test/TestAbstact';
import { CLIENT_ID } from '../../Authorization/Type/OAuth2/IOAuth2Application';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import Metrics from '../../Metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CoreFormsEnum from '../Base/CoreFormsEnum';
import { IApplication } from '../Base/IApplication';
import { ApplicationInstall } from '../Database/ApplicationInstall';

let webhookApplication: IApplication;
let container: DIContainer;
let dbClient: MongoDbClient;
let appInstall: ApplicationInstall;
let db: Db;
let name: string;
let user: string;

describe('tests for WebhookRouter', () => {
    beforeAll(async () => {
        container = await getTestContainer();
        webhookApplication = container.getApplication('webhookName');
        dbClient = container.get(CoreServices.MONGO);
        db = await dbClient.db();
    });

    beforeEach(async () => {
        try {
            await db.dropCollection(ApplicationInstall.getCollection());
            const repo = await dbClient.getApplicationRepository();
            user = 'user';
            name = webhookApplication.getName();

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
        } catch (e) {
            // Ignore non-existent
        }
    });

    afterAll(async () => {
        await dbClient.down();
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('post /webhook/applications/:name/users/:user/subscribe', async () => {
        const applicationUrl = `/webhook/applications/${name}/users/${user}/subscribe`;
        const body = {
            name: 'testTopoName',
            topology: 'testTopo',
        };
        await supertest(expressApp)
            .post(applicationUrl)
            .send(body)
            .expect(StatusCodes.OK, JSON.stringify([]));
    });

    it('get /webhook/applications/:name/users/:user/unsubscribe', async () => {
        const applicationUrl = `/webhook/applications/${name}/users/${user}/unsubscribe`;
        const body = {
            name: 'testTopoName',
            topology: 'testTopo',
        };
        await supertest(expressApp)
            .post(applicationUrl)
            .send(body)
            .expect(StatusCodes.OK, JSON.stringify([]));
    });
});
