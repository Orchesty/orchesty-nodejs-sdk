/* eslint-disable max-classes-per-file */
import { ObjectId } from 'mongodb';
import { getTestContainer } from '../../../../test/TestAbstact';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import Metrics from '../../../Metrics/Metrics';
import ADocument from '../ADocument';
import MongoDbClient from '../Client';
import Deleted from '../Filters/Impl/Deleted';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

let dbClient: MongoDbClient;

class ClassWithoutDeleted extends ADocument {

    public edited = false;

    public constructor(public user = 'withoutDeleted') {
        super();
        this.user = user;
    }

}

class ClassWithDeleted extends ADocument {

    public user = 'withDeleted';

    public deleted = false;

    public getDeleted(): boolean {
        return this.deleted;
    }

    public setDeleted(): this {
        this.deleted = true;
        return this;
    }

}

describe('Tests for repository', () => {
    let container: DIContainer;

    beforeAll(async () => {
        container = await getTestContainer();
    });

    beforeEach(() => {
        dbClient = container.get(CoreServices.MONGO);
    });

    afterAll(async () => {
        await dbClient.down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('ClassWithDeleted', async () => {
        const appInstall = new ClassWithDeleted();

        const repo = await dbClient.getRepository(ClassWithDeleted);
        await repo.insert(appInstall);

        expect(await repo.findOne({ user: 'withDeleted' })).toBeInstanceOf(ClassWithDeleted);
        await repo.remove(appInstall);
    });

    it('ClassWithDeleted - deleted = true', async () => {
        const appInstall = new ClassWithDeleted();
        appInstall.setDeleted();

        const repo = await dbClient.getRepository(ClassWithDeleted);
        await repo.insert(appInstall);

        expect(await repo.findOne({ user: 'withDeleted' })).toBeNull();
        await repo.remove(appInstall);
    });

    it('ClassWithDeleted - deleted filter: disabled', async () => {
        const appInstall = new ClassWithDeleted();
        appInstall.setDeleted();

        const repo = await dbClient.getRepository(ClassWithDeleted);
        repo.disableFilter(Deleted.name);
        await repo.insert(appInstall);

        expect(await repo.findOne({ user: 'withDeleted' })).toBeInstanceOf(ClassWithDeleted);

        await repo.remove(appInstall);
    });

    it('ClassWithDeleted - deleted filter: enabled', async () => {
        const appInstall = new ClassWithDeleted();
        appInstall.setDeleted();

        const repo = await dbClient.getRepository(ClassWithDeleted);
        repo.disableFilter(Deleted.name);
        repo.enableFilter(Deleted.name);
        await repo.insert(appInstall);

        expect(await repo.findOne({ user: 'withDeleted' })).toBeNull();

        await repo.remove(appInstall);
    });

    it('ClassWithoutDeleted', async () => {
        const appInstall = new ClassWithoutDeleted();

        const repo = await dbClient.getRepository(ClassWithoutDeleted);
        await repo.insert(appInstall);

        expect(await repo.findOne({ user: 'withoutDeleted' })).toBeInstanceOf(ClassWithoutDeleted);
        await repo.remove(appInstall);
    });

    it('ClassWithDeleted - deleted: disable/enable nonexist filter', async () => {
        const appInstall = new ClassWithDeleted();
        appInstall.setDeleted();

        const repo = await dbClient.getRepository(ClassWithDeleted);
        expect(() => {
            repo.disableFilter('nonExistFilter');
        }).toThrow('This filter doesn´t exist');
        expect(() => {
            repo.enableFilter('nonExistFilter');
        }).toThrow('This filter doesn´t exist');
    });

    it('repository - upsert, findById', async () => {
        const appInstall = new ClassWithoutDeleted();

        const repo = await dbClient.getRepository(ClassWithoutDeleted);
        await repo.upsert(appInstall);
        const appKey = new ObjectId(appInstall.getId());

        const appInstallMongo = await repo.findById(appKey);

        expect(appInstallMongo).toBeInstanceOf(ClassWithoutDeleted);

        (appInstallMongo as ClassWithoutDeleted).edited = true;

        await repo.upsert(appInstallMongo as ClassWithoutDeleted);
        const appInstallEdited = await repo.findById(appKey);

        expect((appInstallEdited as ClassWithoutDeleted).edited).toBeTruthy();
        expect(appInstallEdited).toBeInstanceOf(ClassWithoutDeleted);
        await repo.remove(appInstallEdited as ClassWithoutDeleted);
    });

    it('repository - findMany', async () => {
        const appInstall = new ClassWithoutDeleted();

        const repo = await dbClient.getRepository(ClassWithoutDeleted);
        await repo.insert(appInstall);
        const appKey = new ObjectId(appInstall.getId());

        const entities = await repo.findMany({ _id: appKey });
        expect(entities[0]).toBeInstanceOf(ClassWithoutDeleted);

        await repo.removeMany({});
    });

    it('repository - findMany with pagination', async () => {
        const appInstall1 = new ClassWithoutDeleted();
        const appInstall2 = new ClassWithoutDeleted('withoutDeleted2');

        const repo = await dbClient.getRepository(ClassWithoutDeleted);
        await repo.insert(appInstall1);
        await repo.insert(appInstall2);

        const entities = await repo.findMany({}, 1, 1);
        expect(entities[0]).toBeInstanceOf(ClassWithoutDeleted);
        expect(entities[0].user).toBe('withoutDeleted2');

        await repo.removeMany({});
    });

    it('repository - findManyById', async () => {
        const appInstall = new ClassWithoutDeleted();
        const appInstall1 = new ClassWithoutDeleted();

        const repo = await dbClient.getRepository(ClassWithoutDeleted);
        await repo.insert(appInstall);
        await repo.insert(appInstall1);
        const appKey = new ObjectId(appInstall.getId());
        const appKey1 = new ObjectId(appInstall1.getId());

        const arrayOfAppInstalls = await repo.findManyById([appKey, appKey1]);
        expect(arrayOfAppInstalls[0]).toBeInstanceOf(ClassWithoutDeleted);
        expect(arrayOfAppInstalls[1]).toBeInstanceOf(ClassWithoutDeleted);
    });

    it('repository - find', async () => {
        const repo = await dbClient.getRepository(ClassWithoutDeleted);
        expect(() => {
            repo.find({});
        }).toThrow('Use findMany method!');
    });
});
