import ACommonNode from '../Commons/ACommonNode';
import ProcessDto from '../Utils/ProcessDto';
import { CONFIRM_DISPLAY, CONFIRM_QUESTION } from '../Utils/Headers';

export default abstract class AConfirm extends ACommonNode {

    public abstract getQuestion(): string;

    public getDisplayFields(): string[] {
        return [];
    }

    public processAction(dto: ProcessDto): ProcessDto {
        const data = dto.getJsonData() as Record<string, unknown>;
        const display: Record<string, unknown> = {};
        for (const field of this.getDisplayFields()) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                display[field] = data[field];
            }
        }

        dto.addHeader(CONFIRM_QUESTION, this.getQuestion());
        dto.addHeader(CONFIRM_DISPLAY, JSON.stringify(display));

        return dto;
    }

}
