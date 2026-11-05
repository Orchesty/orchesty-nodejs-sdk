/* eslint-disable max-classes-per-file */
import TestQuestion from '../../../test/Question/TestQuestion';
import { BATCH_PREFIX } from '../../Batch/BatchRouter';
import AConfirm from '../../Confirm/AConfirm';
import { CONFIRM_PREFIX } from '../../Confirm/ConfirmRouter';
import AConnector from '../../Connector/AConnector';
import { CONNECTOR_PREFIX } from '../../Connector/ConnectorRouter';
import DIContainer from '../../DIContainer/Container';
import logger from '../../Logger/Logger';
import { IQuestionSchema } from '../../Question/AQuestion';
import { QUESTION_PREFIX } from '../../Question/QuestionRouter';
import ProcessDto from '../../Utils/ProcessDto';
import CommonLoader from '../CommonLoader';

class LookalikeConnector extends AConnector {

    public getName(): string {
        return 'lookalike';
    }

    public processAction(dto: ProcessDto): ProcessDto {
        return dto;
    }

    public getQuestion(): string {
        throw new Error('needs arguments');
    }

    protected getSchema(): string {
        return 'http://www.stormware.cz/schema/version_2/data.xsd';
    }

}

class BrokenQuestion extends TestQuestion {

    public getName(): string {
        return 'broken-question';
    }

    public getSchema(): IQuestionSchema {
        throw new Error('needs the application');
    }

}

class TestConfirm extends AConfirm {

    public getName(): string {
        return 'test-confirm';
    }

    public getQuestion(): string {
        return 'Send the order?';
    }

    public getDisplayFields(): string[] {
        return ['id'];
    }

}

describe('CommonLoader', () => {
    let loader: CommonLoader;

    beforeEach(() => {
        const container = new DIContainer();
        const connector = new LookalikeConnector();
        container.setNamed(`${CONNECTOR_PREFIX}.${connector.getName()}`, connector);
        container.setNamed(`${BATCH_PREFIX}.${connector.getName()}`, connector);
        container.setNamed(`${QUESTION_PREFIX}.test-question`, new TestQuestion());
        container.setNamed(`${QUESTION_PREFIX}.broken-question`, new BrokenQuestion());
        container.setNamed(`${CONFIRM_PREFIX}.test-confirm`, new TestConfirm());
        loader = new CommonLoader(container);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([CONNECTOR_PREFIX, BATCH_PREFIX])('lists %s nodes without question or confirm fields', (prefix) => {
        expect(loader.getList(prefix)).toEqual([{ name: 'lookalike', app: undefined }]);
    });

    it('lists the schema of question nodes and leaves out a node that fails', () => {
        const error = jest.spyOn(logger, 'error').mockReturnValue(undefined);

        expect(loader.getList(QUESTION_PREFIX)).toEqual([{
            name: 'test-question',
            app: undefined,
            schema: new TestQuestion().getSchema(),
        }]);
        expect(error).toHaveBeenCalledWith(expect.stringContaining('Node "broken-question" left out'), {});
    });

    it('lists the question and display fields of confirm nodes', () => {
        expect(loader.getList(CONFIRM_PREFIX)).toEqual([{
            name: 'test-confirm',
            app: undefined,
            question: 'Send the order?',
            displayFields: ['id'],
        }]);
    });
});
