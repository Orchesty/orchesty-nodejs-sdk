import ACommonNode from '../../lib/Commons/ACommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestCustomNode extends ACommonNode {
  public getName = (): string => 'testcustom';

  public processAction = (_dto: ProcessDto): ProcessDto => {
    const dto = _dto;
    dto.jsonData = { test: 'custom' };

    return dto;
  };
}
