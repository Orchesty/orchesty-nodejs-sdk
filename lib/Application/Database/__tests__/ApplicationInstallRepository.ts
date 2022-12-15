import { appInstallConfig, mockOnce } from '../../../../test/MockServer';
import { getTestContainer, NAME, USER } from '../../../../test/TestAbstact';
import { orchestyOptions } from '../../../Config/Config';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import { HttpMethods } from '../../../Transport/HttpMethods';
import { ApplicationInstall } from '../ApplicationInstall';
import ApplicationInstallRepository from '../ApplicationInstallRepository';

let container: DIContainer;
let dbClient: MongoDbClient;
let repo: ApplicationInstallRepository;

describe('ApplicationInstallRepository tests', () => {
    beforeAll(() => {
        container = getTestContainer();
        dbClient = container.get(CoreServices.MONGO);
        try {
            repo = dbClient.getApplicationRepository();
        } catch (e) {
            // Ignore non-existent
        }
    });

    afterEach(() => {
        repo.clearCache();
    });

    it('should findByNameAndUser works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":false,"names":["${NAME}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res = await repo.findByNameAndUser(NAME, USER, false);
        expect(res).toBeInstanceOf(ApplicationInstall);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"names":["${NAME}"]}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();

        const res2 = await repo.findByNameAndUser(NAME, USER, true);
        expect(res2).toBe(undefined);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${NAME}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res3 = await repo.findByNameAndUser(NAME, USER, null);
        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findOneByUser works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":false}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res = await repo.findOneByUser(USER, false);
        expect(res).toBeInstanceOf(ApplicationInstall);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();

        const res2 = await repo.findOneByUser(USER, true);
        expect(res2).toBe(undefined);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res3 = await repo.findOneByUser(USER);
        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findOneByName works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":false}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res = await repo.findOneByName(NAME, false);
        expect(res).toBeInstanceOf(ApplicationInstall);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();

        const res2 = await repo.findOneByName(NAME, true);
        expect(res2).toBe(undefined);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res3 = await repo.findOneByName(NAME);
        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findManyByUser works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":false}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res = await repo.findManyByUser(USER, false);
        expect(res).toBeInstanceOf(Array);
        expect(res?.length).toBe(1);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();

        const res2 = await repo.findManyByUser(USER, true);
        expect(res2).toBeInstanceOf(Array);
        expect(res2?.length).toBe(0);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res3 = await repo.findManyByUser(USER);
        expect(res3).toBeInstanceOf(Array);
        expect(res3?.length).toBe(1);
    });

    it('should findManyByName works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":false}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res = await repo.findManyByName(NAME, false);
        expect(res).toBeInstanceOf(Array);
        expect(res?.length).toBe(1);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();

        const res2 = await repo.findManyByName(NAME, true);
        expect(res2).toBeInstanceOf(Array);
        expect(res2?.length).toBe(0);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const res3 = await repo.findManyByName(NAME);
        expect(res3).toBeInstanceOf(Array);
        expect(res3?.length).toBe(1);
    });
});
