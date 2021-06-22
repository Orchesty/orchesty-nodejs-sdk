import { ICommonNode } from '../../lib/Commons/ICommonNode';
import ProcessDTO from '../../lib/Utils/ProcessDTO';
import ResultCode from '../../lib/Utils/ResultCode';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import OnRepeatException from '../../lib/Exception/OnRepeatException';
import CurlSender from '../../lib/Transport/Curl/CurlSender';

export default class TestConnector implements ICommonNode {
  constructor(private _sender: CurlSender) {
  }

  public getName = (): string => 'test';

  public async processAction(dto: ProcessDTO): Promise<ProcessDTO> {
    dto.setJsonData({ test: 'ok', processed: Date.now().toString() });
    dto.setStopProcess(ResultCode.DO_NOT_CONTINUE);

    const requestDto = new RequestDto('http://jsonplaceholder.typicode.com/users', HttpMethods.GET);
    requestDto.setDebugInfo(dto);
    const responseDto = await this._sender.send(requestDto);
    if (responseDto.getResponseCode() !== 200) {
      throw new OnRepeatException(dto);
    }
    dto.setData(responseDto.getBody());

    return dto;
  }
}
