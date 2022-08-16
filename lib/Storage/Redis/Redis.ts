import RedisPool from 'node-redis-connection-pool/dist/src/RedisConnectionPool';

export default class Redis {

    private readonly client: RedisPool;

    public constructor(url: string) {
        this.client = new RedisPool({
            name: 'redis',
            poolOptions: {
                max: 5,
            },
            redisOptions: { url },
        });
    }

    public async close(): Promise<void> {
        const redisClient = await this.client.acquire();
        await this.client.destroy(redisClient);
    }

    public async has(key: string): Promise<boolean> {
        return Boolean(await this.client.sendCommand('exists', [key]));
    }

    public async get(key: string): Promise<string> {
        return this.client.sendCommand('get', [key]);
    }

    public async getMany(keys: string[]): Promise<string[]> {
        return this.client.sendCommand('mget', [keys]);
    }

    public async dropAll(): Promise<void> {
        return this.client.sendCommand('flushall');
    }

    public async set(key: string, value: string, expiresInSeconds?: number): Promise<boolean> {
        const args = [key, value];
        if (expiresInSeconds) {
            args.push('EX');
            args.push(expiresInSeconds.toString());
        }
        const result = await this.client.sendCommand('set', args);
        return result === 'OK';
    }

    public async getSet(key: string, value: string): Promise<string> {
        return this.client.sendCommand('getset', [key, value]);
    }

    // Can be merged with getSet after Redis 7.0 release -> SET currently does not allow NX GET combination
    public async isLocked(key: string, expiration = 30): Promise<boolean> {
        return !await this.client.sendCommand('SET', [key, 1, 'NX', 'EX', expiration]);
    }

    public async remove(key: string): Promise<boolean> {
        await this.client.sendCommand('del', [key]);
        return true;
    }

    public async setExpire(key: string, seconds: number): Promise<void> {
        return this.client.sendCommand('expire', [key, seconds]);
    }

}
