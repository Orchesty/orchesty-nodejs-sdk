import ProcessDto from '../../lib/Utils/ProcessDto';
import ResultCode from '../../lib/Utils/ResultCode';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import OnRepeatException from '../../lib/Exception/OnRepeatException';
import CurlSender from '../../lib/Transport/Curl/CurlSender';
import AConnector from '../../lib/Connector/AConnector';

export default class TestConnector extends AConnector {
  constructor(private _sender: CurlSender) {
    super();
  }

  public getName = (): string => 'test';

  public async processAction(dto: ProcessDto): Promise<ProcessDto> {
    dto.jsonData = {
      test: 'ok',
      processed: Date.now()
        .toString(),
    };
    dto.setStopProcess(ResultCode.DO_NOT_CONTINUE);

    const requestDto = new RequestDto('https://jsonplaceholder.typicode.com/users', HttpMethods.GET);
    requestDto.debugInfo = dto;
    const responseDto = await this._sender.send(requestDto);
    if (responseDto.responseCode !== 200) {
      throw new OnRepeatException(dto);
    }
    dto.data = responseDto.body;

    return dto;
  }
}
