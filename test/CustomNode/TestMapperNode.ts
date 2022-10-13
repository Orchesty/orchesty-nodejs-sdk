import Joi from 'joi';
import ACommonNode from '../../lib/Commons/ACommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';
import { validate } from '../../lib/Utils/Validations';

export const NAME = 'test-mapper';

const inputSchema = Joi.object({
    input: Joi.string().required(),
});

export default class TestMapperNode extends ACommonNode {

    public getName(): string {
        return NAME;
    }

    @validate(inputSchema)
    public processAction(dto: ProcessDto<IInput>): ProcessDto<IOutput> {
        const data = dto.getJsonData();

        return dto.setNewJsonData({ output: data.input });
    }

}

export interface IInput {
    input: string;
}

export interface IOutput {
    output: string;
}
