import { CONFIRM_DISPLAY, CONFIRM_QUESTION } from '../../Utils/Headers';
import ProcessDto from '../../Utils/ProcessDto';
import AConfirm from '../AConfirm';

class TestConfirm extends AConfirm {

    public constructor(private readonly fields: string[]) {
        super();
    }

    public getName(): string {
        return 'test-confirm';
    }

    public getQuestion(): string {
        return 'Send the order?';
    }

    public getDisplayFields(): string[] {
        return this.fields;
    }

}

function display(confirm: AConfirm, data: string): unknown {
    const dto = confirm.processAction(new ProcessDto().setData(data));

    expect(dto.getHeader(CONFIRM_QUESTION)).toBe('Send the order?');

    return JSON.parse(dto.getHeader(CONFIRM_DISPLAY) ?? '');
}

describe('AConfirm', () => {
    it('shows the configured fields', () => {
        expect(display(new TestConfirm(['id', 'total', 'missing']), JSON.stringify({ id: 7, total: 10, note: 'x' })))
            .toEqual({ id: 7, total: 10 });
    });

    it('does not parse the body when there is nothing to display', () => {
        expect(display(new TestConfirm([]), '<order/>')).toEqual({});
    });

    it.each([
        ['is not JSON', '<order/>'],
        ['is JSON null', 'null'],
        ['is a JSON scalar', '5'],
    ])('shows no fields when the body %s', (_, data) => {
        expect(display(new TestConfirm(['id']), data)).toEqual({});
    });
});
