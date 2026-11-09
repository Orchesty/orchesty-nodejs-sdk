import AQuestion, { IQuestionSchema } from '../../lib/Question/AQuestion';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestQuestion extends AQuestion {

    public getName(): string {
        return 'test-question';
    }

    public getQuestion(dto: ProcessDto): string {
        const { greeting } = dto.getJsonData() as { greeting?: string };

        return `${greeting ?? 'Hello'}, what is your name?`;
    }

    public getSchema(): IQuestionSchema {
        return {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
        };
    }

    public shouldSkip(dto: ProcessDto): boolean {
        const { name } = dto.getJsonData() as { name?: string };

        return typeof name === 'string' && name.length > 0;
    }

}
