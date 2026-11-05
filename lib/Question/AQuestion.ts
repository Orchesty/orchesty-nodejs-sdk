import ACommonNode from '../Commons/ACommonNode';
import { QUESTION_SCHEMA, QUESTION_SKIP, QUESTION_TEXT } from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';

export interface IQuestionSchema {
    type: 'object';
    properties: Record<string, unknown>;

    [key: string]: unknown;

    required?: string[];
}

export default abstract class AQuestion extends ACommonNode {

    public abstract getQuestion(dto: ProcessDto): Promise<string> | string;

    public abstract getSchema(): IQuestionSchema;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public shouldSkip(dto: ProcessDto): Promise<boolean> | boolean {
        return false;
    }

    public async processAction(dto: ProcessDto): Promise<ProcessDto> {
        if (await this.shouldSkip(dto)) {
            dto.addHeader(QUESTION_SKIP, '1');

            return dto;
        }

        dto.addHeader(QUESTION_TEXT, await this.getQuestion(dto));
        dto.addHeader(QUESTION_SCHEMA, JSON.stringify(this.getSchema()));

        return dto;
    }

}
