import assert from 'assert';
import DataStorageDocument from '../../DataStore/Document/DataStorageDocument';
import FileSystem from '../FileSystem';

// Mock Logger module
// jest.mock('../../../Logger/Logger', () => ({
//     error: () => jest.fn(),
//     info: () => jest.fn(),
//     Logger: jest.fn().mockImplementation(() => ({})),
// }));

describe('Tests for FileSystem', () => {
    let fileSystem: FileSystem;
    const file = 'testFileName';
    const dataStorageDocument = new DataStorageDocument<Itest>();
    const testData: Itest = {
        name: 'testName',
        email: 'test@email.com',
        phone: 123456789,
    };

    beforeAll(() => {
        fileSystem = new FileSystem();

        dataStorageDocument.setData(testData);
    });

    it('should write/read/delete', async () => {
        assert.equal(await fileSystem.write<Itest>(file, [dataStorageDocument]), true);
        const data = await fileSystem.read<Itest>(file);
        assert.deepEqual(data[0].getData(), testData);
        assert.equal(await fileSystem.delete(file), true);
    });
});

interface Itest {
    name: string;
    phone: number;
    email: string;
}
