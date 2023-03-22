import { Request } from 'express';
import pino from 'pino';
import { appOptions, orchestyOptions } from '../Config/Config';
import { HttpMethods } from '../Transport/HttpMethods';
import AProcessDto from '../Utils/AProcessDto';
import * as headers from '../Utils/Headers';
import { IHttpHeaders } from '../Utils/Headers';
import ResultCode from '../Utils/ResultCode';
import Client from '../Worker-api/Client';

export interface ILogContext {
    timestamp?: number;
    service?: string;
    levelName?: string;
    message?: string;
    previousNodeId?: string;
    nodeId?: string;
    nodeName?: string;
    topologyId?: string;
    topologyName?: string;
    correlationId?: string;
    previousCorrelationId?: string;
    processId?: string;
    parentId?: string;
    sequenceId?: string;
    userId?: string;
    applications?: string;
    resultCode?: ResultCode;
    resultMessage?: string;
    stacktrace?: {
        message: string;
        trace?: string;
    };
    data?: string;
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
        this.logger.info(data);
        this.send(data, isForUi);
    }

    public warn(message: string, context: AProcessDto | ILogContext | Request, isForUi = false): void {
        const data = this.format('warn', message, context);
        this.logger.warn(data);
        this.send(data, isForUi);
    }

    public error(message: string, context: AProcessDto | ILogContext | Request, isForUi = false, err?: Error): void {
        const data = this.format('error', message, context, err);
        this.logger.error(data);
        this.send(data, isForUi);
    }

    public createCtx(payload: AProcessDto | ILogContext | Request): ILogContext {
        if (payload instanceof Request) {
            return this.ctxFromHeaders(JSON.parse((payload as Request)?.body || '{}')?.headers || {});
        }

        if (payload instanceof AProcessDto) {
            return this.ctxFromHeaders(payload.getHeaders());
        }

        return payload as ILogContext;
    }

    public ctxFromHeaders(processHeaders: IHttpHeaders): ILogContext {
        return {
            previousNodeId: headers.getPreviousNodeId(processHeaders),
            nodeId: headers.getNodeId(processHeaders),
            nodeName: headers.getNodeName(processHeaders),
            previousCorrelationId: headers.getPreviousCorrelationId(processHeaders),
            correlationId: headers.getCorrelationId(processHeaders),
            topologyId: headers.getTopologyId(processHeaders),
            topologyName: headers.getTopologyName(processHeaders),
            processId: headers.getProcessId(processHeaders),
            parentId: headers.getParentId(processHeaders),
            sequenceId: headers.getSequenceId(processHeaders),
            userId: headers.getUserId(processHeaders),
            applications: headers.getApplications(processHeaders),
        };
    }

    private send(data: ILogContext, isForUi = false): void {
        if (isForUi) {
            this.workerApi.send('/logger/logs', HttpMethods.POST, { ...data, isForUi: true })
                .catch((e) => {
                    this.logger.error(e);
                });
        }
    }

    private format(
        level: pino.Level,
        message: string,
        payload: AProcessDto | ILogContext | Request,
        err?: Error,
    ): ILogContext {
        const line = this.createCtx(payload);
        line.timestamp = Date.now();
        line.service = 'sdk';
        line.levelName = `${level}`.toLowerCase();
        line.message = message?.replace(/\s\s+/g, ' ');

        if (err) {
            line.stacktrace = {
                message: err.message.replace(/\s\s+/g, ' '),
                trace: err.stack,
            };
        }

        return line;
    }

}

const logger = new Logger();

export default logger;
