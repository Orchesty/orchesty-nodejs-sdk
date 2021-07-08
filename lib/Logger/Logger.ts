/* eslint-disable @typescript-eslint/naming-convention */
import * as os from 'os';
import { Sender } from 'metrics-sender/dist/lib/udp/Sender';
import { Request } from 'express';
import ProcessDto from '../Utils/ProcessDto';
import ResultCode from '../Utils/ResultCode';
import * as headers from '../Utils/Headers';
import { loggerOptions } from '../Config/Config';
import winstonLogger from './Winston';
import Severity from './Severity';
import { parseInfluxDsn } from '../Utils/DsnParser';

export interface ILogContext {
    topology_id?: string;
    node_id?: string;
    node_name?: string;
    correlation_id?: string;
    process_id?: string;
    parent_id?: string;
    sequence_id?: number;
    result_code?: ResultCode;
    result_message?: string;
    error?: Error;
    data?: string;
}

interface ILoggerFormat {
    timestamp: number;
    hostname: string;
    type: string;
    severity: string;
    message: string;
    node_id?: string;
    node_name?: string;
    correlation_id?: string;
    result_code?: ResultCode;
    result_message?: string;
    stacktrace?: {
        message: string,
        trace?: string,
    };
    data?: string;
}

export class Logger {
  /**
     *
     * @param {string} severity
     * @param {string} message
     * @param {ILogContext} context
     * @return {string}
     */
  private static format(severity: string, message: string, context?: ILogContext): ILoggerFormat {
    const line: ILoggerFormat = {
      timestamp: Date.now(),
      hostname: os.hostname(),
      type: 'sdk',
      severity: `${severity}`.toUpperCase(),
      message: message?.replace(/\s\s+/g, ' '),
    };

    if (context) {
      if (context.node_id) {
        line.node_id = context.node_id;
      }

      if (context.correlation_id) {
        line.correlation_id = context.correlation_id;
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
    }

    return line;
  }

    private udp: Sender;

    constructor() {
      const parsed = parseInfluxDsn(loggerOptions.dsn);
      this.udp = new Sender(parsed.server, parsed.port);
    }

    /**
     *
     * @param {string} message
     * @param {ILogContext} context
     */
    public debug(message: string, context?: ILogContext): void {
      this.log(Severity.DEBUG, message, context || {});
    }

    /**
     *
     * @param {string} message
     * @param {ILogContext} context
     */
    public info(message: string, context?: ILogContext): void {
      this.log(Severity.INFO, message, context || {});
    }

    /**
     *
     * @param {string} message
     * @param {ILogContext} context
     */
    public warn(message: string, context?: ILogContext): void {
      this.log(Severity.WARNING, message, context || {});
    }

    /**
     *
     * @param {string} message
     * @param {ILogContext} context
     */
    public error(message: string, context?: ILogContext): void {
      this.log(Severity.ERROR, message, context || {});
    }

    /**
     *
     * @param {ProcessDto} dto
     * @param {Error} err
     * @return {ILogContext}
     */
    public static ctxFromDto(dto: ProcessDto, err?: Error): ILogContext {
      const ctx: ILogContext = {
        node_id: headers.getNodeId(dto.headers),
        correlation_id: headers.getCorrelationId(dto.headers),
        process_id: headers.getProcessId(dto.headers),
        parent_id: headers.getParentId(dto.headers),
        sequence_id: headers.getSequenceId(dto.headers),
      };

      if (err) {
        ctx.error = err;
      }

      return ctx;
    }

    public static ctxFromReq(req: Request, err?: Error): ILogContext {
      const ctx: ILogContext = {
        node_id: headers.getNodeId(req.headers),
        correlation_id: headers.getCorrelationId(req.headers),
        process_id: headers.getProcessId(req.headers),
        parent_id: headers.getParentId(req.headers),
        sequence_id: headers.getSequenceId(req.headers),
      };

      if (err) {
        ctx.error = err;
      }

      return ctx;
    }

    /**
     *
     * @param {string} severity
     * @param {string} message
     * @param {ILogContext} context
     */
    public log(severity: string, message: string, context?: ILogContext): void {
      const data = Logger.format(severity, message, context);

      winstonLogger.log(severity, '', data);
      this.udp.send(JSON.stringify(data))
        .catch(() => {
          // unhandled promise rejection caught
        });
    }
}

const logger = new Logger();

export default logger;
