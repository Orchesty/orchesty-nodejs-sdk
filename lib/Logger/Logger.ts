import { Request } from 'express';
import * as os from 'os';
import pino from 'pino';
import { appOptions, orchestyOptions } from '../Config/Config';
import { HttpMethods } from '../Transport/HttpMethods';
import AProcessDto from '../Utils/AProcessDto';
import * as headers from '../Utils/Headers';
import ResultCode from '../Utils/ResultCode';
import Client from '../Worker-api/Client';

export interface ILogContext {
    topology_id?: string;
    topology_name?: string;
    node_id?: string;
    user_id?: string;
    node_name?: string;
    correlation_id?: string;
    process_id?: string;
    parent_id?: string;
    sequence_id?: number;
    result_code?: ResultCode;
    result_message?: string;
    error?: Error;
    data?: string;
    isForUi?: boolean;
}

interface ILoggerFormat {
    timestamp: number;
    hostname: string;
    type: string;
    severity: string;
    message: string;
    node_id?: string;
    user_id?: string;
    node_name?: string;
    topology_id?: string;
    topology_name?: string;
    correlation_id?: string;
    result_code?: ResultCode;
    result_message?: string;
    stacktrace?: {
        message: string;
        trace?: string;
    };
    data?: string;
    isForUi?: boolean;
}

export class Logger {

    private readonly logger = pino({ level: appOptions.debug ? 'debug' : 'info' });

    private readonly workerApi = new Client(orchestyOptions.workerApi);

    public debug(message: string, context: AProcessDto | ILogContext | Request, isForUi = false): void {
        const data = this.format('debug', message, context);
        this.logger.debug(data, message);
        this.send(data, isForUi);
    }

    public info(message: string, context: AProcessDto | ILogContext | Request, isForUi = false): void {
        const data = this.format('info', message, context);
        this.logger.info(data, message);
        this.send(data, isForUi);
    }

    public warn(message: string, context: AProcessDto | ILogContext | Request, isForUi = false): void {
        const data = this.format('warn', message, context);
        this.logger.warn(data, message);
        this.send(data, isForUi);
    }

    public error(message: string, context: AProcessDto | ILogContext | Request, isForUi = false, err?: Error): void {
        const data = this.format('error', message, context, err);
        this.logger.error(data, message);
        this.send(data, isForUi);
    }

    public createCtx(
        payload: AProcessDto | ILogContext | Request,
        err?: Error,
    ): ILogContext {
        if (payload) {
            if (payload instanceof Request) {
                return this.ctxFromReq(payload as Request, err);
            }
            if (payload instanceof AProcessDto) {
                return this.ctxFromDto(payload, err);
            }
            return payload as ILogContext;
        }

        return {};
    }

    public ctxFromDto(dto: AProcessDto, err?: Error): ILogContext {
        const ctx: ILogContext = {
            node_id: headers.getNodeId(dto.getHeaders()),
            correlation_id: headers.getCorrelationId(dto.getHeaders()),
            topology_id: headers.getTopologyId(dto.getHeaders()),
            process_id: headers.getProcessId(dto.getHeaders()),
            parent_id: headers.getParentId(dto.getHeaders()),
            sequence_id: headers.getSequenceId(dto.getHeaders()),
            user_id: headers.getUserId(dto.getHeaders()),
        };

        if (err) {
            ctx.error = err;
        }

        return ctx;
    }

    public ctxFromReq(req: Request, err?: Error): ILogContext {
        const ctx: ILogContext = {
            node_id: headers.getNodeId(req.headers),
            correlation_id: headers.getCorrelationId(req.headers),
            topology_id: headers.getTopologyId(req.headers),
            process_id: headers.getProcessId(req.headers),
            parent_id: headers.getParentId(req.headers),
            sequence_id: headers.getSequenceId(req.headers),
            user_id: headers.getUserId(req.headers),
        };

        if (err) {
            ctx.error = err;
        }

        return ctx;
    }

    private send(data: unknown, isForUi = false): void {
        if (isForUi) {
            this.workerApi.send('/logger/logs', HttpMethods.POST, data).catch((e) => {
                this.logger.error(e);
            });
        }
    }

    private format(
        level: pino.Level,
        message: string,
        payload: AProcessDto | ILogContext | Request,
        err?: Error,
    ): ILoggerFormat {
        const line: ILoggerFormat = {
            timestamp: Date.now(),
            hostname: os.hostname(),
            type: 'sdk',
            severity: `${level}`.toUpperCase(),
            message: message?.replace(/\s\s+/g, ' '),
        };

        const context = this.createCtx(payload, err);

        if (context.topology_id) {
            line.topology_id = context.topology_id;
        }

        if (context.topology_name) {
            line.topology_name = context.topology_name;
        }

        if (context.correlation_id) {
            line.correlation_id = context.correlation_id;
        }

        if (context.user_id) {
            line.user_id = context.user_id;
        }

        if (context.node_id) {
            line.node_id = context.node_id;
        }

        if (context.node_name) {
            line.node_name = context.node_name;
        }

        if (context.result_code && context.result_code >= 0) {
            line.result_code = context.result_code;
        }

        if (context.result_message) {
            line.result_message = context.result_message;
        }

        if (context.error) {
            line.stacktrace = {
                message: context.error.message.replace(/\s\s+/g, ' '),
                trace: context.error.stack,
            };
        }

        if (context.data) {
            line.data = context.data;
        }

        return line;
    }

}

const logger = new Logger();

export default logger;
