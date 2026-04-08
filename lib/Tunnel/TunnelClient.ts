import axios from 'axios';
import express from 'express';
import http from 'http';
import path from 'path';
import { tunnelOptions } from '../Config/Config';
import logger from '../Logger/Logger';

interface Frame {
    worker_id: string;
    request_id: string;
    method: string;
    payload: Buffer;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    status_code: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    http_method: string;
}

interface GrpcClient {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    OpenTunnel(): GrpcDuplexStream;
}

interface GrpcDuplexStream {
    write(frame: Frame): boolean;
    on(event: string, handler: (...args: unknown[]) => void): void;
    cancel(): void;
    destroy(): void;
}

const MAX_RECONNECT_INTERVAL = 60_000;

export default class TunnelClient {

    private localServer: http.Server | null = null;

    private localPort = 0;

    private stream: GrpcDuplexStream | null = null;

    private grpcClient: GrpcClient | null = null;

    private stopping = false;

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private reconnectAttempt = 0;

    private readonly onSignal: () => void;

    public constructor(
        private readonly expressApp: express.Application,
        private readonly options: typeof tunnelOptions,
    ) {
        this.onSignal = this.handleSignal.bind(this);
    }

    public async start(): Promise<void> {
        if (!this.options.proxyUrl) {
            throw new Error('TUNNEL_PROXY_URL is required when TUNNEL_ENABLED=true');
        }
        if (!this.options.workerId) {
            throw new Error('TUNNEL_WORKER_ID is required when TUNNEL_ENABLED=true');
        }

        await this.startLocalServer();

        this.grpcClient = await this.createGrpcClient();
        this.connect();

        process.once('SIGTERM', this.onSignal);
        process.once('SIGINT', this.onSignal);
    }

    public async stop(): Promise<void> {
        if (this.stopping) return;
        this.stopping = true;

        process.removeListener('SIGTERM', this.onSignal);
        process.removeListener('SIGINT', this.onSignal);

        logger.info('[tunnel] Shutting down...', {});

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.stream) {
            try {
                this.stream.cancel();
            } catch { /* stream may already be closed */ }
            this.stream = null;
        }

        if (this.localServer) {
            const server = this.localServer;
            await new Promise<void>((resolve) => {
                server.close(() => resolve());
            });
            this.localServer = null;
        }

        logger.info('[tunnel] Shutdown complete.', {});
    }

    private handleSignal(): void {
        this.stop().catch((err: unknown) => {
            logger.error(`[tunnel] Error during shutdown: ${err instanceof Error ? err.message : String(err)}`, {});
        });
    }

    private async startLocalServer(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.localServer = http.createServer(this.expressApp);
            this.localServer.listen(0, '127.0.0.1', () => {
                const addr = this.localServer?.address();
                if (addr && typeof addr === 'object') {
                    this.localPort = addr.port;
                }
                logger.info(`[tunnel] Internal Express server on 127.0.0.1:${this.localPort}`, {});
                resolve();
            });
        });
    }

    private async createGrpcClient(): Promise<GrpcClient> {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const grpc = await import('@grpc/grpc-js');
        // eslint-disable-next-line import/no-extraneous-dependencies
        const protoLoader = await import('@grpc/proto-loader');

        const protoPath = path.resolve(__dirname, 'proto', 'tunnel.proto');
        const packageDef = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const proto = grpc.loadPackageDefinition(packageDef) as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention, @typescript-eslint/prefer-destructuring
        const TunnelService = (proto.tunnel as any).TunnelService;

        return new TunnelService(
            this.options.proxyUrl,
            grpc.credentials.createInsecure(),
            {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'grpc.keepalive_time_ms': 30_000,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'grpc.keepalive_timeout_ms': 10_000,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'grpc.keepalive_permit_without_calls': 1,
            },
        ) as GrpcClient;
    }

    private connect(): void {
        if (this.stopping || !this.grpcClient) return;

        logger.info(`[tunnel] Connecting to ${this.options.proxyUrl} as "${this.options.workerId}"...`, {});

        const stream = this.grpcClient.OpenTunnel();
        this.stream = stream;

        stream.write({
            worker_id: this.options.workerId,
            request_id: '',
            method: '',
            payload: Buffer.alloc(0),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            status_code: 0,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            http_method: '',
        });

        stream.on('data', (...args: unknown[]) => {
            if (this.stream !== stream) return;
            if (this.reconnectAttempt > 0) {
                logger.info('[tunnel] Connection confirmed by server.', {});
                this.reconnectAttempt = 0;
            }
            const frame = args[0] as Frame;
            this.handleFrame(frame).catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                logger.error(`[tunnel] Error handling frame ${frame.request_id}: ${msg}`, {});
            });
        });

        stream.on('error', (err: unknown) => {
            if (this.stream !== stream || this.stopping) return;
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(`[tunnel] Stream error: ${message}`, {});
            this.scheduleReconnect();
        });

        stream.on('end', () => {
            if (this.stream !== stream || this.stopping) return;
            logger.warn('[tunnel] Stream ended by server.', {});
            this.scheduleReconnect();
        });

        logger.info('[tunnel] Connected and waiting for requests.', {});
    }

    private scheduleReconnect(): void {
        if (this.stopping || this.reconnectTimer) return;

        this.stream = null;
        this.reconnectAttempt += 1;

        const delay = Math.min(
            this.options.reconnectInterval * (2 ** (this.reconnectAttempt - 1)),
            MAX_RECONNECT_INTERVAL,
        );
        logger.info(`[tunnel] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})...`, {});

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    private writeToStream(frame: Frame): void {
        if (!this.stream) {
            logger.warn(`[tunnel] Cannot send response for ${frame.request_id}: stream disconnected`, {});
            return;
        }
        this.stream.write(frame);
    }

    private async handleFrame(frame: Frame): Promise<void> {
        if (!frame.request_id || !frame.method) return;

        const httpMethod = (frame.http_method || 'POST').toUpperCase();
        const methodPath = frame.method.replace(/^\//, '');

        try {
            const response = await axios({
                method: httpMethod,
                url: `http://127.0.0.1:${this.localPort}/${methodPath}`,
                data: frame.payload,
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer',
                validateStatus: () => true,
                transformRequest: [(data: unknown) => data],
            });

            this.writeToStream({
                worker_id: this.options.workerId,
                request_id: frame.request_id,
                method: frame.method,
                payload: Buffer.from(response.data),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                status_code: response.status,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                http_method: httpMethod,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`[tunnel] Failed to process frame ${frame.request_id}: ${message}`, {});

            this.writeToStream({
                worker_id: this.options.workerId,
                request_id: frame.request_id,
                method: frame.method,
                payload: Buffer.from(JSON.stringify({ body: '', headers: { 'result-code': '1006', 'result-message': message } })),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                status_code: 500,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                http_method: httpMethod,
            });
        }
    }

}
