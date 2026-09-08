import ACommonNode from '../../lib/Commons/ACommonNode';
import AuditCheckpointRoleEnum from '../../lib/Commons/AuditCheckpointRoleEnum';
import { IAuditCheckpoint } from '../../lib/Commons/IAuditCheckpoint';
import OnStopAndFailException from '../../lib/Exception/OnStopAndFailException';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestOnStopAndFailExceptionNode extends ACommonNode {

    public getName(): string {
        return 'testOnStopAndFailExceptionCustom';
    }

    public getAuditCheckpoint(): IAuditCheckpoint {
        return { role: AuditCheckpointRoleEnum.PROCESS_EXIT, fields: ['id'] };
    }

    public processAction(_dto: ProcessDto): ProcessDto {
        throw new OnStopAndFailException('stop and fail');
    }

}
