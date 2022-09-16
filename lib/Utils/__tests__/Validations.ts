import { checkParams } from '../Validations';

describe('Validations', () => {
    it('array', () => {
        const data = { k1: 1, k2: '' };
        expect(checkParams(data, ['k1', 'k2'])).toBeTruthy();
        expect(() => {
            checkParams(data, ['k1', 'k3']);
        }).toThrow('Missing required param [k3]');
    });

    it('shallow object', () => {
        const data = { k1: '', k2: '' };
        expect(checkParams(data, { k1: '', k2: '' })).toBeTruthy();
        expect(() => {
            checkParams(data, { k1: '', k3: '' });
        }).toThrow('Missing required param [k3]');
    });

    it('deep object', () => {
        const data = { k1: { k2: '' } };
        expect(checkParams(data, { k1: { k2: '' } })).toBeTruthy();
        expect(() => {
            checkParams(data, { k1: { k3: '' } });
        }).toThrow('Missing required param [k3]');
    });

    it('object with array', () => {
        const data = { k1: [{ k2: '' }] };
        expect(checkParams(data, { k1: [{ k2: '' }] })).toBeTruthy();
        expect(() => {
            checkParams(data, { k1: [{ k3: '' }] });
        }).toThrow('Missing required param [k3]');
        expect(() => {
            checkParams(data, { k1: { k2: '' } });
        }).toThrow('Missing required param [k2]');
    });

    it('object with array as nested array', () => {
        const data = { k1: [{ k2: '' }, { k2: '' }] };
        expect(checkParams(data, { k1: [['k2']] }))
            .toBeTruthy();
        const data2 = { k1: [{ k2: '' }, { k3: '' }] };
        expect(() => {
            checkParams(data2, { k1: [['k2']] });
        }).toThrow('Missing required param [k2]');
    });

    it('object as array', () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const data = { k1: { 0: { k2: '' }, 1: { k2: '' } } };
        expect(checkParams(data, { k1: [['k2']] }))
            .toBeTruthy();
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const data2 = { k1: { 0: { k2: '' }, 1: { k3: '' } } };
        expect(() => {
            checkParams(data2, { k1: [['k2']] });
        }).toThrow('Missing required param [k2]');
    });

    it('mixed', () => {
        const data = { k1: [{ k2: '' }], kk: { kkk: 1 } };
        expect(checkParams(data, { k1: [{ k2: '' }], kk: ['kkk'] })).toBeTruthy();
    });

    it('strict - ok', () => {
        const data = { k1: 1 };
        expect(checkParams(data, { k1: 1 }, true)).toBeTruthy();
    });

    it('strict - undefined', () => {
        const data = { k1: undefined };
        expect(() => {
            checkParams(data, { k1: 1 }, true);
        }).toThrow('Missing required param [k1]');
    });

    it('strict - null', () => {
        const data = { k1: null };
        expect(() => {
            checkParams(data, { k1: 1 }, true);
        }).toThrow('Missing required param [k1]');
    });

    it('strict - empty', () => {
        const data = { k1: '' };
        expect(() => {
            checkParams(data, { k1: 1 }, true);
        }).toThrow('Missing required param [k1]');
    });

    it('strict - nested', () => {
        const data = { items: [{ code: null }] };
        expect(() => checkParams(data, { items: [{ code: true }] }, true))
            .toThrow('Missing required param [code]');
    });
});
