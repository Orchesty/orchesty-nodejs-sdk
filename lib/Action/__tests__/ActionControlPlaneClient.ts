import ActionControlPlaneClient, { GRANT_CACHE_MAX } from '../ActionControlPlaneClient';

function mockFetch(status: number, body: string): jest.SpyInstance {
    return jest.spyOn(global, 'fetch').mockImplementation(async () => {
        await Promise.resolve();

        return new Response(body, { status });
    });
}

const validGrant = JSON.stringify({ action: 'demo.echo', allowed: true, audit: true, expires_in: 60 });

describe('ActionControlPlaneClient', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('caches a valid grant', async () => {
        const fetch = mockFetch(200, validGrant);
        const client = new ActionControlPlaneClient('http://backend/', 'key');

        await expect(client.grant('demo.echo', 'u@x.io')).resolves.toMatchObject({ allowed: true, audit: true });

        await client.grant('demo.echo', 'u@x.io');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch.mock.calls[0][0]).toBe('http://backend/api/actions/grant');
    });

    it.each([
        ['a body that is not JSON', '<html>maintenance</html>'],
        ['a JSON body without allowed: true', JSON.stringify({ audit: true })],
        ['allowed: false', JSON.stringify({ allowed: false, audit: true })],
    ])('refuses a 2xx response with %s and does not cache it', async (_, body) => {
        const fetch = mockFetch(200, body);
        const client = new ActionControlPlaneClient('http://backend', 'key');

        await expect(client.grant('demo.echo', 'u@x.io')).rejects.toMatchObject({ status: 502 });
        await expect(client.grant('demo.echo', 'u@x.io')).rejects.toMatchObject({ status: 502 });

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('propagates a refused grant', async () => {
        mockFetch(403, JSON.stringify({ message: 'User may not run action.' }));
        const client = new ActionControlPlaneClient('http://backend', 'key');

        await expect(client.grant('demo.echo', 'u@x.io')).rejects.toMatchObject({
            status: 403,
            message: 'User may not run action.',
        });
    });

    it('asks again once a grant expires', async () => {
        const fetch = mockFetch(200, JSON.stringify({ allowed: true, audit: false, expires_in: 0 }));
        const client = new ActionControlPlaneClient('http://backend', 'key');

        await client.grant('demo.echo', 'u@x.io');
        await client.grant('demo.echo', 'u@x.io');

        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('evicts the oldest grants when the cache is full', async () => {
        const fetch = mockFetch(200, validGrant);
        const client = new ActionControlPlaneClient('http://backend', 'key');

        for (let i = 0; i <= GRANT_CACHE_MAX; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await client.grant('demo.echo', `user-${i}@x.io`);
        }

        expect(fetch).toHaveBeenCalledTimes(GRANT_CACHE_MAX + 1);

        await client.grant('demo.echo', `user-${GRANT_CACHE_MAX}@x.io`);

        expect(fetch).toHaveBeenCalledTimes(GRANT_CACHE_MAX + 1);

        await client.grant('demo.echo', 'user-0@x.io');

        expect(fetch).toHaveBeenCalledTimes(GRANT_CACHE_MAX + 2);
    });
});
