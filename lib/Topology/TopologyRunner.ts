import { StatusCodes } from 'http-status-codes';
import { Headers } from 'node-fetch';
import CurlSender from '../Transport/Curl/CurlSender';
import ResponseDto from '../Transport/Curl/ResponseDto';
import logger from '../Logger/Logger';
import { pipesOptions } from '../Config/Config';
import RequestDto from '../Transport/Curl/RequestDto';
import HttpMethods from '../Transport/HttpMethods';
import OnRepeatException from '../Exception/OnRepeatException';
import ProcessDto from '../Utils/ProcessDto';
import {
  createKey, getCorrelationId, getNodeId, PREV_CORRELATION_ID, PREV_NODE_ID,
} from '../Utils/Headers';

export default class TopologyRunner {
  constructor(private _curlSender: CurlSender) {
  }

  public static getWebhookUrl(topology: string, node: string, token: string): string {
    return `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}/token/${token}/run`;
  }

  public async runByName(
    data: Record<string, unknown>,
    topology: string,
    node: string,
    processDto: ProcessDto,
    _user?: string,
  ): Promise<ResponseDto> {
    const user = _user !== undefined ? `/user/${_user}` : '';
    const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run-by-name`;

    return this._run(url, data, processDto);
  }

  public async runById(
    data: Record<string, unknown>,
    topology: string,
    node: string,
    processDto: ProcessDto,
    _user?: string,
  ): Promise<ResponseDto> {
    const user = _user !== undefined ? `/user/${_user}` : '';
    const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run`;

    return this._run(url, data, processDto);
  }

  private async _run(url: string, data: Record<string, unknown>, processDto: ProcessDto): Promise<ResponseDto> {
    let errMessage = `Call of starting-point with url [${url}] has been failed. Reason [__reason__]`;
    try {
      const corrIdKey = createKey(PREV_CORRELATION_ID);
      const nodeIdKey = createKey(PREV_NODE_ID);
      const requestDto = new RequestDto(
        url,
        HttpMethods.POST,
        processDto,
        JSON.stringify(data),
        new Headers({
          [corrIdKey]: getCorrelationId(processDto.headers) ?? '',
          [nodeIdKey]: getNodeId(processDto.headers) ?? '',
        }),
      );
      const resp = await this._curlSender.send(requestDto);
      if (resp.responseCode !== StatusCodes.OK) {
        errMessage = errMessage.replace('__reason__', 'ResponseCode is not 200');
        logger.error(errMessage, processDto);
        throw new OnRepeatException(60, 10, errMessage);
      }

      return resp;
    } catch (e) {
      if (e instanceof OnRepeatException) {
        throw e;
      }
      if (e instanceof Error) {
        errMessage = errMessage.replace('__reason__', e.message || 'unknown');
        logger.error(e.message || `${errMessage}: Unknown error!`, processDto);
      }

      throw new OnRepeatException(60, 10, errMessage);
    }
  }
}
