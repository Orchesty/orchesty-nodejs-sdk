import fetch, { FetchError, RequestInit, Response } from 'node-fetch';
import RequestDto from './RequestDto';
import logger from '../../Logger/Logger';
import ResponseDto from './ResponseDto';
import {
  APPLICATION, CORRELATION_ID, NODE_ID, USER,
} from '../../Utils/Headers';
import Severity from '../../Logger/Severity';
import Metrics, { IStartMetrics } from '../../Metrics/Metrics';
import OnRepeatException from '../../Exception/OnRepeatException';

export default class CurlSender {
  constructor(private _metrics: Metrics) {
  }

  public send = async (
    dto: RequestDto,
    allowedCodes?: number[],
    sec = 60,
    hops = 10,
    // eslint-disable-next-line @typescript-eslint/require-await
    logMessageCallback = async (res: Response, body: string) => `status: ${res.status}, body: ${body}`,
  ): Promise<ResponseDto> => {
    const startTime = Metrics.getCurrentMetrics();
    try {
      const req = CurlSender._createInitFromDto(dto);
      logger.log(
        Severity.DEBUG,
        `Request send.
       Method: ${dto.method},
       Url: ${dto.url},
       Headers: ${JSON.stringify(dto.headers)},
       Body: ${dto.body}`,
        dto.debugInfo,
      );
      const response = await fetch(dto.url, req);
      await this._sendMetrics(dto, startTime);
      const buffer = await response.buffer();
      const body = buffer.toString();
      if (!response.ok) {
        CurlSender._log(dto, response, Severity.ERROR, body);
      } else {
        CurlSender._log(dto, response, Severity.DEBUG, body);
      }

      if (allowedCodes && !allowedCodes.includes(response.status)) {
        throw new OnRepeatException(sec, hops, await logMessageCallback(response, body));
      }

      return new ResponseDto(body, response.status, response.headers, buffer, response.statusText);
    } catch (e) {
      await this._sendMetrics(dto, startTime);
      if (e instanceof Error) {
        logger.error(e.message, dto.debugInfo);
      }

      if (e instanceof FetchError) {
        if (e.message.includes('network timeout')) {
          throw new OnRepeatException(sec, hops, e.message);
        }
      }

      throw e;
    }
  };

  private static _createInitFromDto(dto: RequestDto): RequestInit {
    const req: RequestInit = {
      method: dto.method,
      headers: dto.headers,
      timeout: dto.timeout,
    };

    if (dto.body !== undefined) {
      req.body = dto.body;
    }

    return req;
  }

  private static _log({ debugInfo }: RequestDto, res: Response, level: Severity, body?: string): void {
    let message = 'Request success.';
    if (res.status > 300) {
      message = 'Request failed.';
    }

    logger.log(
      level,
      `${message}
       Code: ${res.status},
       Message: ${body ?? 'Empty response'},
       Reason: ${res.statusText}`,
      debugInfo,
    );
  }

  private async _sendMetrics(dto: RequestDto, startTimes: IStartMetrics): Promise<void> {
    const info = dto.debugInfo;
    try {
      const times = Metrics.getTimes(startTimes);
      await this._metrics.sendCurlMetrics(
        times,
        info.getHeader(NODE_ID),
        info.getHeader(CORRELATION_ID),
        info.getHeader(USER),
        info.getHeader(APPLICATION),
      ).catch((e) => (logger.error(e?.message ?? e, info)));
    } catch (e) {
      if (typeof e === 'string') logger.error(e, info);
    }
  }
}
