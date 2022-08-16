import ANode from '../Commons/ANode';
import CurlSender from '../Transport/Curl/CurlSender';
import ResponseDto from '../Transport/Curl/ResponseDto';
import AProcessDto from '../Utils/AProcessDto';
import ResultCode from '../Utils/ResultCode';

export default abstract class ACommonConnector extends ANode {

    protected okStatuses = [200, 201];

    private clSender?: CurlSender;

    public setSender(sender: CurlSender): this {
        this.clSender = sender;

        return this;
    }

    public evaluateStatusCode(res: ResponseDto, dto: AProcessDto, message?: string): boolean {
        if (this.okStatuses.includes(res.responseCode)) {
            return true;
        }

        dto.setStopProcess(
            ResultCode.STOP_AND_FAILED,
            message ?? `Response code [${res.responseCode}] didn't match allowed codes [${this.okStatuses.join(',')}]`,
        );

        return false;
    }

    protected get sender(): CurlSender {
        if (this.clSender) {
            return this.clSender;
        }

        throw new Error('CurlSender has not been set.');
    }

}
