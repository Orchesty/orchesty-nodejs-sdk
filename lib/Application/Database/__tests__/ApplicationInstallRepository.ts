import { appInstallConfig, mockOnce } from '../../../../test/MockServer';
import { getTestContainer, NAME, SDK, USER } from '../../../../test/TestAbstact';
import { orchestyOptions } from '../../../Config/Config';
import DIContainer from '../../../DIContainer/Container';
import DatabaseClient from '../../../Storage/Database/Client';
import { HttpMethods } from '../../../Transport/HttpMethods';
import { ApplicationInstall } from '../ApplicationInstall';
import ApplicationInstallRepository from '../ApplicationInstallRepository';

let container: DIContainer;
let dbClient: DatabaseClient;
let repo: ApplicationInstallRepository;

describe('ApplicationInstallRepository tests', () => {
    beforeAll(() => {
        container = getTestContainer();
        dbClient = container.get(DatabaseClient);
        try {
            repo = dbClient.getApplicationRepository();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Ignore non-existent
        }
    });

    it('should findByNameAndUser works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":false,"names":["${NAME}"],"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res = await repo.findByNameAndUser(NAME, USER, [SDK], false);

        expect(res).toBeInstanceOf(ApplicationInstall);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"names":["${NAME}"],"sdks":["${SDK}"]}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();
        const res2 = await repo.findByNameAndUser(NAME, USER, [SDK], true);

        expect(res2).toBe(undefined);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":null,"names":["${NAME}"],"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res3 = await repo.findByNameAndUser(NAME, USER, [SDK], null);

        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findOneByUser works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":false,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res = await repo.findOneByUser(USER, [SDK], false);

        expect(res).toBeInstanceOf(ApplicationInstall);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();
        const res2 = await repo.findOneByUser(USER, [SDK], true);

        expect(res2).toBe(undefined);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res3 = await repo.findOneByUser(USER, [SDK]);

        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findOneByName works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":false,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res = await repo.findOneByName(NAME, [SDK], false);

        expect(res).toBeInstanceOf(ApplicationInstall);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();
        const res2 = await repo.findOneByName(NAME, [SDK], true);

        expect(res2).toBe(undefined);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res3 = await repo.findOneByName(NAME, [SDK]);

        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findManyByUser works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":false,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res = await repo.findManyByUser(USER, [SDK], false);

        expect(res).toBeInstanceOf(Array);
        expect(res?.length).toBe(1);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();
        const res2 = await repo.findManyByUser(USER, [SDK], true);

        expect(res2).toBeInstanceOf(Array);
        expect(res2?.length).toBe(0);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res3 = await repo.findManyByUser(USER, [SDK]);

        expect(res3).toBeInstanceOf(Array);
        expect(res3?.length).toBe(1);
    });

    it('should findManyByName works', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":false,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res = await repo.findManyByName(NAME, [SDK], false);

        expect(res).toBeInstanceOf(Array);
        expect(res?.length).toBe(1);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [] },
        }]);

        repo.clearCache();
        const res2 = await repo.findManyByName(NAME, [SDK], true);

        expect(res2).toBeInstanceOf(Array);
        expect(res2?.length).toBe(0);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"names":["${NAME}"],"enabled":true,"sdks":["${SDK}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();
        const res3 = await repo.findManyByName(NAME, [SDK]);

        expect(res3).toBeInstanceOf(Array);
        expect(res3?.length).toBe(1);
    });
});
