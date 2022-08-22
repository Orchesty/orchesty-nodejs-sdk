import ACommonNode from '../../lib/Commons/ACommonNode';
import OnRepeatException from '../../lib/Exception/OnRepeatException';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestOnRepeatExceptionNode extends ACommonNode {

    public getName(): string {
        return 'testOnRepeatExceptionCustom';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public processAction(_dto: ProcessDto): ProcessDto {
        throw new OnRepeatException();
    }

}
