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
const TESTKEY2 = 'testKey2';
const TESTKEY3 = 'testKey3';
const TESTKEYVALUE = 'testKeyValue';
const TESTKEYVALUE1 = 'testKeyValue1';
const TESTKEYVALUE2 = 'testKeyValue2';

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

    it('pushToList', async () => {
        expect(await redis.pushToList(TESTKEY, TESTKEYVALUE, 5)).toEqual(1);
        expect(await redis.pushToList(TESTKEY, TESTKEYVALUE, 5)).toEqual(2);
        expect(await redis.pushToList(TESTKEY, TESTKEYVALUE, 5)).toEqual(3);
    });

    it('getFirstElementAndMoveToEnd', async () => {
        await redis.pushToList(TESTKEY, TESTKEYVALUE, 10);
        await redis.pushToList(TESTKEY, TESTKEYVALUE1, 10);
        await redis.pushToList(TESTKEY, TESTKEYVALUE2, 10);

        const first = await redis.getList(TESTKEY);
        expect(first[0]).toBe(TESTKEYVALUE);
        expect(first[1]).toBe(TESTKEYVALUE1);
        expect(first[2]).toBe(TESTKEYVALUE2);
        const response = await redis.getFirstElementAndMoveToEnd(TESTKEY);
        expect(response).toBe(TESTKEYVALUE);
        const second = await redis.getList(TESTKEY);
        expect(second[0]).toBe(TESTKEYVALUE1);
        expect(second[1]).toBe(TESTKEYVALUE2);
        expect(second[2]).toBe(TESTKEYVALUE);
        const response1 = await redis.getFirstElementAndMoveToEnd(TESTKEY);
        expect(response1).toBe(TESTKEYVALUE1);
        const third = await redis.getList(TESTKEY);
        expect(third[0]).toBe(TESTKEYVALUE2);
        expect(third[1]).toBe(TESTKEYVALUE);
        expect(third[2]).toBe(TESTKEYVALUE1);
    });

    it('getFirstElementAndMoveToEnd - empty array', async () => {
        expect(await redis.getFirstElementAndMoveToEnd(TESTKEY)).toBeNull();
    });

    it('incrBy', async () => {
        await redis.incrBy(TESTKEY2, 33);
        await redis.incrBy(TESTKEY2, 33);
        expect(await redis.incrBy(TESTKEY2, 33)).toEqual(99);
    });

    it('decrBy', async () => {
        await redis.set(TESTKEY3, '33');
        await redis.decrBy(TESTKEY3, 11);
        expect(await redis.decrBy(TESTKEY3, 11)).toEqual(11);
    });
});
