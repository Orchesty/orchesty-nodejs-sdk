import assert from 'assert';
import { getTestContainer } from '../../../../test/TestAbstact';
import { storageOptions } from '../../../Config/Config';
import CryptManager from '../../../Crypt/CryptManager';
import WindWalkerCrypt from '../../../Crypt/Impl/WindWalkerCrypt';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import Metrics from '../../../Metrics/Metrics';
import MongoDbClient from '../../Mongodb/Client';
import DataStorageManager from '../DataStorageManager';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    info: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test ETL Manager', () => {
    let dbClient: MongoDbClient;
    let container: DIContainer;

    beforeAll(async () => {
        container = await getTestContainer();
        dbClient = new MongoDbClient(
            storageOptions.dsn,
            new CryptManager([new WindWalkerCrypt('123')]),
            container,
        );
    });

    afterAll(async () => {
        await dbClient.down();
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('should etl works', async () => {
        const user = 'user';
        const app = 'app';
        const id = '123';

        const dataStorageManager = new DataStorageManager(dbClient);
        await dataStorageManager.store(id, [{ foo: 'bar' }, { john: 'doe' }], app, user);
        await dataStorageManager.store(id, [{ foo: 'bar1' }, { john: 'doe1' }], app, user);

        let data = await dataStorageManager.load(id, app, user);
        assert.deepEqual(data[0].getData(), { foo: 'bar' });
        assert.deepEqual(data[1].getData(), { john: 'doe' });
        assert.deepEqual(data[2].getData(), { foo: 'bar1' });
        assert.deepEqual(data[3].getData(), { john: 'doe1' });

        data = await dataStorageManager.load(id, app, user, 2, 2);
        assert.deepEqual(data[0].getData(), { foo: 'bar1' });
        assert.deepEqual(data[1].getData(), { john: 'doe1' });

        await dataStorageManager.remove(id, app, user);

        const data2 = await dataStorageManager.load(id, app, user);
        assert.deepEqual(data2, []);
    });
});
