import assert from 'assert';
import { getTestContainer } from '../../../../test/TestAbstact';
import { storageOptions } from '../../../Config/Config';
import CryptManager from '../../../Crypt/CryptManager';
import WindWalkerCrypt from '../../../Crypt/Impl/WindWalkerCrypt';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import Metrics from '../../../Metrics/Metrics';
import MongoDbClient from '../../Mongodb/Client';
import ETLManager from '../ETLManager';

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
        const process = '123';

        const etl = new ETLManager(dbClient);
        await etl.storeData(user, app, process, [{ foo: 'bar' }, { john: 'doe' }]);

        const data = await etl.getData(user, app, process);
        assert.deepEqual(data[0].getData(), { foo: 'bar' });
        assert.deepEqual(data[1].getData(), { john: 'doe' });

        await etl.removeData(user, app, process);

        const data2 = await etl.getData(user, app, process);
        assert.deepEqual(data2, []);
    });
});
