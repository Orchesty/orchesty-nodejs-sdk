export function parseInfluxDsn(dsn: string): { server: string; port: number } {
    let server;
    let port;
    [server, port] = dsn.split(':');
    // TODO: better parsing

    server = server ?? '';
    port = parseInt(port, 10);

    return { server, port };
}
