import ANode from '../Commons/ANode';
import CurlSender from '../Transport/Curl/CurlSender';
import ResponseDto from '../Transport/Curl/ResponseDto';
import AProcessDto from '../Utils/AProcessDto';
import ResultCode from '../Utils/ResultCode';

export default abstract class ACommonConnector extends ANode {

    private sender?: CurlSender;

    protected okStatuses = [200, 201];

    public setSender(sender: CurlSender): this {
        this.sender = sender;

        return this;
    }

    public evaluateStatusCode(res: ResponseDto, dto: AProcessDto, message?: string): boolean {
        if (this.okStatuses.includes(res.getResponseCode())) {
            return true;
        }

        dto.setStopProcess(
            ResultCode.STOP_AND_FAILED,
            message
            ?? `Response code [${res.getResponseCode()}] didn't match allowed codes [${this.okStatuses.join(',')}]`,
        );

        return false;
    }

    protected getSender(): CurlSender {
        if (this.sender) {
            return this.sender;
        }

        throw new Error('CurlSender has not been set.');
    }

}
