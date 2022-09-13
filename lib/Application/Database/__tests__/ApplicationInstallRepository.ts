import { getTestContainer } from '../../../../test/TestAbstact';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import { ApplicationInstall } from '../ApplicationInstall';
import ApplicationInstallRepository from '../ApplicationInstallRepository';

let container: DIContainer;
let dbClient: MongoDbClient;
let appInstall: ApplicationInstall;
let repo: ApplicationInstallRepository<ApplicationInstall>;

const USER = 'user';
const NAME = 'name';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    Logger: jest.fn()
        .mockImplementation(() => ({})),
}));

describe('ApplicationInstallRepository tests', () => {
    beforeAll(async () => {
        container = await getTestContainer();
        dbClient = container.get(CoreServices.MONGO);
        const db = await dbClient.db();
        try {
            await db.dropCollection(ApplicationInstall.getCollection());
            repo = await dbClient.getApplicationRepository();
        } catch (e) {
            // Ignore non-existent
        }
    });

    afterEach(async () => {
        await repo.remove(appInstall);
    });

    afterAll(async () => {
        await dbClient.down();
    });

    it('should findByNameAndUser works', async () => {
        appInstall = new ApplicationInstall();
        appInstall
            .setUser(USER)
            .setName(NAME);

        await repo.insert(appInstall);

        const res = await repo.findByNameAndUser(NAME, USER, false);
        expect(res).toBeInstanceOf(ApplicationInstall);

        const res2 = await repo.findByNameAndUser(NAME, USER, true);
        expect(res2).toBeNull();

        const res3 = await repo.findByNameAndUser(NAME, USER, null);
        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findOneByUser works', async () => {
        appInstall = new ApplicationInstall();
        appInstall
            .setUser(USER)
            .setName(NAME);

        await repo.insert(appInstall);

        const res = await repo.findOneByUser(USER, false);
        expect(res).toBeInstanceOf(ApplicationInstall);

        const res2 = await repo.findOneByUser(USER, true);
        expect(res2).toBeNull();

        const res3 = await repo.findOneByUser(USER, null);
        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findOneByName works', async () => {
        appInstall = new ApplicationInstall();
        appInstall
            .setUser(USER)
            .setName(NAME);

        await repo.insert(appInstall);

        const res = await repo.findOneByName(NAME, false);
        expect(res).toBeInstanceOf(ApplicationInstall);

        const res2 = await repo.findOneByName(NAME, true);
        expect(res2).toBeNull();

        const res3 = await repo.findOneByName(NAME, null);
        expect(res3).toBeInstanceOf(ApplicationInstall);
    });

    it('should findManyByUser works', async () => {
        appInstall = new ApplicationInstall();
        appInstall
            .setUser(USER)
            .setName(NAME);

        await repo.insert(appInstall);

        const res = await repo.findManyByUser(USER, false);
        expect(res).toBeInstanceOf(Array);
        expect(res?.length).toBe(1);

        const res2 = await repo.findManyByUser(USER, true);
        expect(res2).toBeInstanceOf(Array);
        expect(res2?.length).toBe(0);

        const res3 = await repo.findManyByUser(USER, null);
        expect(res3).toBeInstanceOf(Array);
        expect(res3?.length).toBe(1);
    });

    it('should findManyByName works', async () => {
        appInstall = new ApplicationInstall();
        appInstall
            .setUser(USER)
            .setName(NAME);

        await repo.insert(appInstall);

        const res = await repo.findManyByName(NAME, false);
        expect(res).toBeInstanceOf(Array);
        expect(res?.length).toBe(1);

        const res2 = await repo.findManyByName(NAME, true);
        expect(res2).toBeInstanceOf(Array);
        expect(res2?.length).toBe(0);

        const res3 = await repo.findManyByName(NAME, null);
        expect(res3).toBeInstanceOf(Array);
        expect(res3?.length).toBe(1);
    });
});
