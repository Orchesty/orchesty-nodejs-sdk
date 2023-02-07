import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { createDocumentMockedServer, mockOnce } from '../../../test/MockServer';
import { expressApp, getApplicationWithSettings, getTestContainer, USER, WEBHOOK_NAME } from '../../../test/TestAbstact';
import { orchestyOptions } from '../../Config/Config';
import DIContainer from '../../DIContainer/Container';
import DatabaseClient from '../../Storage/Database/Client';
import { HttpMethods } from '../../Transport/HttpMethods';

let container: DIContainer;
let dbClient: DatabaseClient;

describe('tests for WebhookRouter', () => {
    beforeAll(() => {
        container = getTestContainer();
        dbClient = container.get(DatabaseClient);
    });

    beforeEach(() => {
        const repo = dbClient.getApplicationRepository();
        repo.clearCache();

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${WEBHOOK_NAME}"]}`,
            },
            response: { body: [getApplicationWithSettings(undefined, WEBHOOK_NAME)] },
        }]);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: /https:\/\/sp.orchesty.com\/webhook\/topologies\/testTopo\/nodes\/testNode\/token\/*/,
            },
            response: { body: Buffer.from(JSON.stringify({ id: '1' })) },
        }]);

        createDocumentMockedServer();
    });

    it('post /webhook/applications/:name/users/:user/subscribe', async () => {
        const body = {
            name: 'testTopoName',
            topology: 'testTopo',
        };
        await supertest(expressApp)
            .post(`/webhook/applications/${WEBHOOK_NAME}/users/${USER}/subscribe`)
            .send(body)
            .expect(StatusCodes.OK, JSON.stringify([]));
    });

    it('get /webhook/applications/:name/users/:user/unsubscribe', async () => {
        const body = {
            name: 'testTopoName',
            topology: 'testTopo',
        };
        await supertest(expressApp)
            .post(`/webhook/applications/${WEBHOOK_NAME}/users/${USER}/unsubscribe`)
            .send(body)
            .expect(StatusCodes.OK, JSON.stringify([]));
    });
});
