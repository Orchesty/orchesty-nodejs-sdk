import CurlSender from '../Transport/Curl/CurlSender';
import ACommonNode from '../Commons/ACommonNode';
import ResultCode from '../Utils/ResultCode';
import ResponseDto from '../Transport/Curl/ResponseDto';
import AProcessDto from '../Utils/AProcessDto';
import { IApplication } from '../Application/Base/IApplication';
import MongoDbClient from '../Storage/Mongodb/Client';

export default abstract class AConnector extends ACommonNode {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected sender?: CurlSender;

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

  public setApplication(application: IApplication): AConnector {
    this.application = application;

    return this;
  }

  public setDb(db: MongoDbClient): AConnector {
    this.db = db;

    return this;
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
