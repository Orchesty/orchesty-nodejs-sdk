import assert from 'assert';
import { getTestContainer } from '../../../../test/TestAbstact';
import FileSystem from '../../File/FileSystem';
import DataStorageManager from '../DataStorageManager';

describe('Test ETL Manager', () => {
    beforeAll(() => {
        getTestContainer();
    });

    it('should etl works', async () => {
        const user = 'user';
        const app = 'app';
        const id = '123';

        const dataStorageManager = new DataStorageManager(new FileSystem());
        await dataStorageManager.remove(id);
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
