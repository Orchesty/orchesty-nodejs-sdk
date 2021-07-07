import fetch, { RequestInit, Response } from 'node-fetch';
import RequestDto from './RequestDto';
import logger, { Logger } from '../../Logger/Logger';
import ResponseDto from './ResponseDto';
import {
  APPLICATION, CORRELATION_ID, NODE_ID, USER,
} from '../../Utils/Headers';
import Severity from '../../Logger/Severity';
import Metrics, { IStartMetrics } from '../../Metrics/Metrics';

export default class CurlSender {
  constructor(private _metrics: Metrics) {
  }

  public send = async (dto: RequestDto): Promise<ResponseDto> => {
    const startTime = Metrics.getCurrentMetrics();
    try {
      const response = await fetch(dto.url, CurlSender._createInitFromDto(dto));
      await this._sendMetrics(dto, startTime);
      const body = await response.text();
      if (!response.ok) {
        CurlSender._log(dto, response, Severity.ERROR, body);
      } else {
        CurlSender._log(dto, response, Severity.DEBUG, body);
      }

      return new ResponseDto(body, response.status, response.headers, response.statusText);
    } catch (e) {
      await this._sendMetrics(dto, startTime);
      logger.error(e);
      return Promise.reject(e);
    }
  };

  private static _createInitFromDto(dto: RequestDto): RequestInit {
    return {
      method: dto.method,
      headers: dto.headers,
      body: dto.body,
      timeout: dto.timeout,
    };
  }

  private static _log({ debugInfo }: RequestDto, res: Response, level: string, body?: string): void {
    let message = 'Request success.';
    if (res.status !== 200) {
      message = 'Request failed.';
    }

    logger.log(
      level,
      `${message}
       Code: ${res.status},
       Message: ${body ?? 'Empty response'},
       Reason: ${res.statusText}`,
      debugInfo ? Logger.ctxFromDto(debugInfo) : undefined,
    );
  }

  private async _sendMetrics(dto: RequestDto, startTimes: IStartMetrics): Promise<void> {
    const info = dto.debugInfo;
    try {
      if (info) {
        const times = Metrics.getTimes(startTimes);
        await this._metrics.sendCurlMetrics(
          times,
          info.getHeader(NODE_ID),
          info.getHeader(CORRELATION_ID),
          info.getHeader(USER),
          info.getHeader(APPLICATION),
        );
      }
    } catch (e) {
      logger.error(e, info ? Logger.ctxFromDto(info) : undefined);
    }
  }
}
