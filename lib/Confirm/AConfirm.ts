import ACommonNode from '../Commons/ACommonNode';
import { CONFIRM_DISPLAY, CONFIRM_QUESTION } from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';

export default abstract class AConfirm extends ACommonNode {

    public abstract getQuestion(): string;

    public getDisplayFields(): string[] {
        return [];
    }

    public processAction(dto: ProcessDto): ProcessDto {
        const display: Record<string, unknown> = {};
        const fields = this.getDisplayFields();
        if (fields.length) {
            const data = this.getObjectData(dto);
            for (const field of fields) {
                if (Object.hasOwn(data, field)) {
                    display[field] = data[field];
                }
            }
        }

        dto.addHeader(CONFIRM_QUESTION, this.getQuestion());
        dto.addHeader(CONFIRM_DISPLAY, JSON.stringify(display));

        return dto;
    }

    private getObjectData(dto: ProcessDto): Record<string, unknown> {
        try {
            const data: unknown = dto.getJsonData();

            return data && typeof data === 'object' ? data as Record<string, unknown> : {};
        } catch {
            return {};
        }
    }

}
