import CurlSender from '../Transport/Curl/CurlSender';
import ResponseDto from '../Transport/Curl/ResponseDto';
import logger from '../Logger/Logger';
import { pipesOptions } from '../Config/Config';
import RequestDto from '../Transport/Curl/RequestDto';
import HttpMethods from '../Transport/HttpMethods';
import OnRepeatException from '../Exception/OnRepeatException';

export default class TopologyRunner {
  constructor(private _curlSender: CurlSender) {
  }

  public async runByName(
    data: Record<string, unknown>,
    topology: string,
    node: string,
    _user?: string,
  ): Promise<ResponseDto> {
    const user = _user !== undefined ? `/user/${_user}` : '';
    const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run-by-name`;

    return this._run(url, data);
  }

  public async runById(
    data: Record<string, unknown>,
    topology: string,
    node: string,
    _user?: string,
  ): Promise<ResponseDto> {
    const user = _user !== undefined ? `/user/${_user}` : '';
    const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run`;

    return this._run(url, data);
  }

  private async _run(url: string, data: Record<string, unknown>): Promise<ResponseDto> {
    let errMessage = `Call of starting-point with url [${url}] has been failed. Reason [__reason__]`;
    try {
      const requestDto = new RequestDto(url, HttpMethods.POST, JSON.stringify(data));
      const resp = await this._curlSender.send(requestDto);
      if (resp.responseCode !== 200) {
        errMessage = errMessage.replace('__reason__', 'ResponseCode is not 200');
        logger.error(errMessage);
        throw new OnRepeatException(60, 10, errMessage);
      }

      return resp;
    } catch (e) {
      if (e instanceof OnRepeatException) {
        throw e;
      }

      errMessage = errMessage.replace('__reason__', e.message || 'unknown');
      logger.error(e.message || `${errMessage}: Unknown error!`);
      throw new OnRepeatException(60, 10, errMessage);
    }
  }
}
