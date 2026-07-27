import { AuditData } from '../AProcessDto';
import BatchProcessDto from '../BatchProcessDto';
import { AUDIT_ENTITY, BATCH_CURSOR, LIMITER_KEY, USER } from '../Headers';

describe('Tests ProcessDto utils', () => {
    it('ShouldRemoveBatchCursor', () => {
        const dto = new BatchProcessDto();
        const cursorName = 'name';
        dto.setBatchCursor(cursorName);
        dto.removeBatchCursor();

        expect(dto.getHeader(BATCH_CURSOR)).toBeUndefined();
    });

    it('removeBatchCursor removes iterate-only cursor correctly', () => {
        const dto = new BatchProcessDto();
        dto.setBatchCursor('0', true);

        dto.removeBatchCursor();

        expect(dto.getHeaders()).toEqual({});
    });

    it('removeBatchCursor removes batch-with-cursor cursor correctly', () => {
        const dto = new BatchProcessDto();
        dto.setBatchCursor('0');

        dto.removeBatchCursor();

        expect(dto.getHeaders()).toEqual({});
    });

    it('addMessage adds message correctly', () => {
        const dto = new BatchProcessDto();
        const message = { body: '', headers: { key: 'value' } };
        dto.addMessage(message);

        expect(dto.getMessages()).toEqual([message]);
    });

    it('setMessages adds message correctly', () => {
        const dto = new BatchProcessDto();
        const message = { body: '', headers: { key: 'value' } };
        dto.setMessages([message]);

        expect(dto.getMessages()).toEqual([message]);
    });

    it('addItem adds message correctly', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        const message = { foo: 'bar' };
        dto.addItem(message, 'abc');
        dto.addItem(message, undefined, 'limit');
        dto.addItem(message, 'abc', 'limit');

        expect(dto.getMessages()).toEqual([
            { body: '{"foo":"bar"}', headers: { [USER]: 'abc' } },
            { body: '{"foo":"bar"}', headers: { [LIMITER_KEY]: 'limit' } },
            { body: '{"foo":"bar"}', headers: { [USER]: 'abc', [LIMITER_KEY]: 'limit' } },
        ]);
    });

    it('setFree drops both messages and the bridge data', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        dto.setBridgeData(JSON.stringify({ foo: 'bar' }));
        dto.addItem({ foo: 'bar' });

        dto.setFree(true);

        expect(dto.getData()).toEqual('');
        expect(dto.getMessages()).toEqual([]);
    });

    it('setItemList adds message correctly', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        const message = { foo: 'bar' };
        dto.setItemList([message]);

        expect(dto.getMessages()).toEqual([{ body: '{"foo":"bar"}', headers: {} }]);
    });

    it('addItemWithAudit single-entity overload sets audit-entity header', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        dto.addItemWithAudit({ foo: 'bar' }, 'order', 'id', [{ id: '1', trackingId: 'T1' }]);

        expect(dto.getMessages()).toEqual([{
            body: '{"foo":"bar"}',
            headers: {
                [AUDIT_ENTITY]: JSON.stringify({
                    order: { key: 'id', fields: [{ id: '1', trackingId: 'T1' }] },
                }),
            },
        }]);
    });

    it('addItemWithAudit map overload merges multiple entities', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        const audits: AuditData = {
            order: { key: 'id', fields: [{ id: '1' }] },
            invoice: { key: 'id', fields: [{ id: 'A' }] },
        };
        dto.addItemWithAudit({ foo: 'bar' }, audits);

        expect(dto.getMessages()).toEqual([{
            body: '{"foo":"bar"}',
            headers: {
                [AUDIT_ENTITY]: JSON.stringify({
                    order: { key: 'id', fields: [{ id: '1' }] },
                    invoice: { key: 'id', fields: [{ id: 'A' }] },
                }),
            },
        }]);
    });

    it('addItemWithAudit merges with pre-existing audit-entity header on the dto', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        dto.addHeader(AUDIT_ENTITY, JSON.stringify({
            parent: { key: 'id', fields: [{ id: 'P' }] },
        }));

        dto.addItemWithAudit({ foo: 'bar' }, 'order', 'id', [{ id: '1' }]);

        expect(dto.getMessages()).toEqual([{
            body: '{"foo":"bar"}',
            headers: {
                [AUDIT_ENTITY]: JSON.stringify({
                    parent: { key: 'id', fields: [{ id: 'P' }] },
                    order: { key: 'id', fields: [{ id: '1' }] },
                }),
            },
        }]);
    });

    it('addItemWithAudit pre-existing header is overridden per-entity by new spec', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        dto.addHeader(AUDIT_ENTITY, JSON.stringify({
            order: { key: 'id', fields: [{ id: 'OLD' }] },
            parent: { key: 'id', fields: [{ id: 'P' }] },
        }));

        dto.addItemWithAudit({ foo: 'bar' }, 'order', 'id', [{ id: 'NEW' }]);

        expect(dto.getMessages()).toEqual([{
            body: '{"foo":"bar"}',
            headers: {
                [AUDIT_ENTITY]: JSON.stringify({
                    order: { key: 'id', fields: [{ id: 'NEW' }] },
                    parent: { key: 'id', fields: [{ id: 'P' }] },
                }),
            },
        }]);
    });

    it('addItemWithAudit propagates user and limit to addItem (single-entity overload)', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        dto.addItemWithAudit({ foo: 'bar' }, 'order', 'id', [{ id: '1' }], 'abc', 'limit');

        expect(dto.getMessages()).toEqual([{
            body: '{"foo":"bar"}',
            headers: {
                [LIMITER_KEY]: 'limit',
                [USER]: 'abc',
                [AUDIT_ENTITY]: JSON.stringify({
                    order: { key: 'id', fields: [{ id: '1' }] },
                }),
            },
        }]);
    });

    it('addItemWithAudit propagates user and limit to addItem (map overload)', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        const audits: AuditData = {
            order: { key: 'id', fields: [{ id: '1' }] },
        };
        dto.addItemWithAudit({ foo: 'bar' }, audits, 'abc', 'limit');

        expect(dto.getMessages()).toEqual([{
            body: '{"foo":"bar"}',
            headers: {
                [LIMITER_KEY]: 'limit',
                [USER]: 'abc',
                [AUDIT_ENTITY]: JSON.stringify({
                    order: { key: 'id', fields: [{ id: '1' }] },
                }),
            },
        }]);
    });
});
