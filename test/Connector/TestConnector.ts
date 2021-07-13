import ProcessDto from '../../lib/Utils/ProcessDto';
import ResultCode from '../../lib/Utils/ResultCode';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../lib/Transport/HttpMethods';
import OnRepeatException from '../../lib/Exception/OnRepeatException';
import AConnector from '../../lib/Connector/AConnector';

export default class TestConnector extends AConnector {
  public getName = (): string => 'test';

  public async processAction(_dto: ProcessDto): Promise<ProcessDto> {
    const dto = _dto;
    dto.jsonData = {
      test: 'ok',
      processed: Date.now()
        .toString(),
    };
    dto.setStopProcess(ResultCode.DO_NOT_CONTINUE);

    const requestDto = new RequestDto('https://jsonplaceholder.typicode.com/users', HttpMethods.POST);
    requestDto.debugInfo = dto;
    const responseDto = await this._sender.send(requestDto);
    if (responseDto.responseCode !== 200) {
      throw new OnRepeatException();
    }
    dto.data = responseDto.body;

    return dto;
  }
}
