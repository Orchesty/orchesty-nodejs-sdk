import CurlSender from '../Transport/Curl/CurlSender';
import ResponseDto from '../Transport/Curl/ResponseDto';
import logger from '../Logger/Logger';
import { pipesOptions } from '../Config/Config';
import RequestDto from '../Transport/Curl/RequestDto';
import HttpMethods from '../Transport/HttpMethods';

export default class TopologyRunner {
  constructor(private _curlSender: CurlSender) {
  }

  public async runByName(
    data: Record<string, undefined>,
    topology: string,
    node: string,
    _user?: string,
  ): Promise<ResponseDto> {
    const user = _user !== undefined ? `/user/${_user}` : '';
    const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run-by-name`;

    return this._run(url, data);
  }

  public async runById(
    data: Record<string, undefined>,
    topology: string,
    node: string,
    _user?: string,
  ): Promise<ResponseDto> {
    const user = _user !== undefined ? `/user/${_user}` : '';
    const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run`;

    return this._run(url, data);
  }

  private async _run(url: string, data: Record<string, undefined>): Promise<ResponseDto> {
    const errMessage = `Call of starting-point with url [${url}] has been failed.`;
    try {
      const requestDto = new RequestDto(url, HttpMethods.POST, JSON.stringify(data));
      const resp = await this._curlSender.send(requestDto);
      if (resp.responseCode !== 200) {
        logger.error(errMessage);
      }

      return resp;
    } catch (e) {
      logger.error(e.message || `${errMessage}: Unknown error!`);
      throw e;
    }
  }
}
