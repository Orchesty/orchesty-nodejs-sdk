/* eslint-disable @typescript-eslint/naming-convention */
import * as os from 'os';
import { Sender } from 'metrics-sender/dist/lib/udp/Sender';
import { Request } from 'express';
import AProcessDto from '../Utils/AProcessDto';
import ResultCode from '../Utils/ResultCode';
import * as headers from '../Utils/Headers';
import { loggerOptions } from '../Config/Config';
import winstonLogger from './Winston';
import Severity from './Severity';
import { parseInfluxDsn } from '../Utils/DsnParser';

export interface ILogContext {
    topology_id?: string;
    topology_name?: string;
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
    isForUi?: boolean;
}

interface ILoggerFormat {
    timestamp: number;
    hostname: string;
    type: string;
    severity: string;
    message: string;
    node_id?: string;
    node_name?: string;
    topology_id?: string;
    topology_name?: string;
    correlation_id?: string;
    result_code?: ResultCode;
    result_message?: string;
    stacktrace?: {
        message: string,
        trace?: string,
    };
    data?: string;
    isForUi?: boolean;
}

export class Logger {
  private udp: Sender;

  public constructor() {
    const parsed = parseInfluxDsn(loggerOptions.dsn);
    this.udp = new Sender(parsed.server, parsed.port);
  }

  public debug(message: string, context: ILogContext | AProcessDto | Request, isForUi = false): void {
    this.log(Severity.DEBUG, message, this.createCtx(context, isForUi));
  }

  public info(message: string, context: ILogContext | AProcessDto | Request, isForUi = false): void {
    this.log(Severity.INFO, message, this.createCtx(context, isForUi));
  }

  public warn(message: string, context: ILogContext | AProcessDto | Request, isForUi = false): void {
    this.log(Severity.WARNING, message, this.createCtx(context, isForUi));
  }

  public error(message: string, context: ILogContext | AProcessDto | Request, isForUi = false): void {
    this.log(Severity.ERROR, message, this.createCtx(context, isForUi));
  }

  public log(severity: Severity, message: string, context: ILogContext): void {
    const data = this.format(severity, message, context);

    winstonLogger.log(severity, '', data);
    if (context.isForUi) {
      this.udp.send(JSON.stringify(data))
        .catch(() => {
          // unhandled promise rejection caught
        });
    }
  }

  public createCtx = (
    payload: Request | AProcessDto | ILogContext,
    isForUi?: boolean,
    err?: Error,
  ): ILogContext => {
    if (payload) {
      if (payload instanceof Request) {
        return this.ctxFromReq(payload as Request, err);
      }
      if (payload instanceof AProcessDto) {
        return this.ctxFromDto(payload as AProcessDto, isForUi, err);
      }
      return payload as ILogContext;
    }

    return {};
  };

  public ctxFromDto = (dto: AProcessDto, isForUi?: boolean, err?: Error): ILogContext => {
    const ctx: ILogContext = {
      node_id: headers.getNodeId(dto.headers),
      correlation_id: headers.getCorrelationId(dto.headers),
      topology_id: headers.getTopologyId(dto.headers),
      process_id: headers.getProcessId(dto.headers),
      parent_id: headers.getParentId(dto.headers),
      sequence_id: headers.getSequenceId(dto.headers),
    };

    if (err) {
      ctx.error = err;
    }

    if (isForUi) {
      ctx.isForUi = isForUi;
    }

    return ctx;
  };

  public ctxFromReq = (req: Request, err?: Error): ILogContext => {
    const ctx: ILogContext = {
      node_id: headers.getNodeId(req.headers),
      correlation_id: headers.getCorrelationId(req.headers),
      topology_id: headers.getTopologyId(req.headers),
      process_id: headers.getProcessId(req.headers),
      parent_id: headers.getParentId(req.headers),
      sequence_id: headers.getSequenceId(req.headers),
    };

    if (err) {
      ctx.error = err;
    }

    return ctx;
  };

  private format = (severity: Severity, message: string, context?: ILogContext): ILoggerFormat => {
    const line: ILoggerFormat = {
      timestamp: Date.now(),
      hostname: os.hostname(),
      type: 'sdk',
      severity: `${severity}`.toUpperCase(),
      message: message?.replace(/\s\s+/g, ' '),
    };

    if (context) {
      if (context.topology_id) {
        line.topology_id = context.topology_id;
      }

      if (context.topology_name) {
        line.topology_name = context.topology_name;
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
  };
}

const logger = new Logger();

export default logger;
