import ACommonNode from '../../lib/Commons/ACommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';
import OnRepeatException from '../../lib/Exception/OnRepeatException';

export default class TestOnRepeatExceptionNode extends ACommonNode {
  public getName = (): string => 'testOnRepeatExceptionCustom';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public processAction = (_dto: ProcessDto): ProcessDto => {
    throw new OnRepeatException();
  };
}
