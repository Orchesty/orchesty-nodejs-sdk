import ACommonNode from '../Commons/ACommonNode';
import CurlSender from '../Transport/Curl/CurlSender';
import ResponseDto from '../Transport/Curl/ResponseDto';
import AProcessDto from '../Utils/AProcessDto';
import ResultCode from '../Utils/ResultCode';

export default abstract class AConnector extends ACommonNode {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected sender?: CurlSender;

  protected _okStatuses = [200, 201];

  public setSender(sender: CurlSender): this {
    this.sender = sender;

    return this;
  }

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

  protected get _sender(): CurlSender {
    if (this.sender) {
      return this.sender;
    }

    throw new Error('CurlSender has not set.');
  }
}
