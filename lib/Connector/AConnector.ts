import CurlSender from '../Transport/Curl/CurlSender';
import ACommonNode from '../Commons/ACommonNode';
import ResultCode from '../Utils/ResultCode';
import ResponseDto from '../Transport/Curl/ResponseDto';
import AProcessDto from '../Utils/AProcessDto';

export default abstract class AConnector extends ACommonNode {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private sender?: CurlSender;

  protected _okStatuses = [200, 201];

  public evaluateStatusCode(res: ResponseDto, dto: AProcessDto, message?: string): boolean {
    if (this._okStatuses.includes(res.responseCode)) {
      return true;
    }

    dto.setStopProcess(
      ResultCode.STOP_AND_FAILED,
      message ?? `Response code [${res.responseCode}] didn't match allowed codes [${this._okStatuses.join(',')}]`,
    );

    return false;
  }

  public setSender(sender: CurlSender): AConnector {
    this.sender = sender;

    return this;
  }

  protected get _sender(): CurlSender {
    if (this.sender) {
      return this.sender;
    }

    throw new Error('CurlSender has not set.');
  }
}
