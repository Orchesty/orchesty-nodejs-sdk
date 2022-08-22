import Redis from '../Redis';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    log: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

const TESTKEY = 'testKey';
const TESTKEY1 = 'testKey1';
const TESTKEYVALUE = 'testKeyValue';
const TESTKEYVALUE1 = 'testKeyValue1';

let redis: Redis;

describe('Tests for redis', () => {
    beforeAll(() => {
        redis = new Redis(process.env.REDIS_DSN ?? '');
    });

    afterEach(async () => {
        await redis.remove(TESTKEY);
    });

    afterAll(async () => {
        await redis.close();
    });

    it('has', async () => {
        expect(await redis.has(TESTKEY))
            .toBeFalsy();
    });

    it('isLocked', async () => {
        expect(await redis.isLocked(TESTKEY))
            .toBeFalsy();
        expect(await redis.isLocked(TESTKEY))
            .toBeTruthy();
    });

    it('set', async () => {
        expect(await redis.set(TESTKEY, TESTKEYVALUE, 5))
            .toBeTruthy();
    });

    it('get', async () => {
        await redis.set(TESTKEY, TESTKEYVALUE);
        expect(await redis.get(TESTKEY))
            .toEqual(TESTKEYVALUE);
    });

    it('getSet', async () => {
        expect(await redis.getSet('first', '1'))
            .toBeNull();
        expect(await redis.getSet('first', '2'))
            .toEqual('1');
        expect(await redis.getSet('first', '3'))
            .toEqual('2');
    });

    it('getMany', async () => {
        await redis.set(TESTKEY, TESTKEYVALUE);
        await redis.set(TESTKEY1, TESTKEYVALUE1);
        const values = await redis.getMany([TESTKEY, TESTKEY1]);
        expect(values).toContainEqual(TESTKEYVALUE);
        expect(values).toContainEqual(TESTKEYVALUE1);
    });

    it('dropAll', async () => {
        await redis.set(TESTKEY, TESTKEYVALUE);
        await redis.set(TESTKEY1, TESTKEYVALUE1);
        await redis.dropAll();
        expect(await redis.getMany([TESTKEY, TESTKEY1])).toEqual([null, null]);
    });

    it('remove', async () => {
        await redis.set(TESTKEY, TESTKEYVALUE);
        await redis.remove(TESTKEY);
        expect(await redis.get(TESTKEY))
            .toBeNull();
    });

    it('setExpire', async () => {
        await redis.set(TESTKEY, TESTKEYVALUE);
        await redis.setExpire(TESTKEY, 1);
        await new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
        expect(await redis.get(TESTKEY)).toBeNull();
    });
});
