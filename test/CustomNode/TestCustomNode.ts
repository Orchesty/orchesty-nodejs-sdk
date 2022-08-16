import ACommonNode from '../../lib/Commons/ACommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestCustomNode extends ACommonNode {

    public getName(): string {
        return 'testcustom';
    }

    public processAction(dto: ProcessDto): ProcessDto {
        dto.jsonData = { test: 'custom', inner: { date: Date.now().toString(), one: 2 } };

        return dto;
    }

}
