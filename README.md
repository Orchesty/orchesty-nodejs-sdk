# NODE.JS Orchesty SDK

## How to use ?
- Install the package `@orchesty/nodejs-sdk`
- Import the package ``import { listen ,container , initiateContainer } from '@orchesty/nodejs-sdk';``
- First you will need to initiate the container by calling `initiateContainer();`
- Then start the server using listen `listen()`
- In between you will need to create node
  - Example: `const getOrderDetail = new getOrderDetail();`
- Finally, you will need to register the node into the DIContainer and you can do that by using this method
  - Example:  `container.setConnector(getOrderDetail)`

## How to develop
1. Run `make init` for start dev environment
2. Tests can be run by `make test` or `make fasttest`

## Audit checkpoints (Trace)

The SDK lets a node declare itself as a **business audit checkpoint** so the
[Trace](https://github.com/orchesty/orchesty/tree/master/trace) service can
return per-entity input/output snapshots (time, payload, status) without
duplicating large payloads in storage.

### Declaring a checkpoint

Override `getAuditCheckpoint()` on the node class. It is a static metadata
declaration — defined once on the class, not inside `processAction`:

```ts
import AConnector from '@orchesty/nodejs-sdk/dist/lib/Connector/AConnector';
import AuditCheckpointRoleEnum from '@orchesty/nodejs-sdk/dist/lib/Commons/AuditCheckpointRoleEnum';
import { IAuditCheckpoint } from '@orchesty/nodejs-sdk/dist/lib/Commons/IAuditCheckpoint';

export default class EshopOrderReceiveConnector extends AConnector {
    public getName(): string {
        return 'eshop-order-receive';
    }

    public getAuditCheckpoint(): IAuditCheckpoint {
        return {
            role: AuditCheckpointRoleEnum.PROCESS_ENTRY,
            fields: ['id', 'trackingId'],
        };
    }

    public async processAction(dto: ProcessDto): Promise<ProcessDto> {
        return dto;
    }
}
```

The enum values resolve to the same lowercase strings (`process_entry`,
`process_step`, `process_exit`) that are emitted on the wire today, so the
bridge contract is unchanged.

Allowed roles:

- `AuditCheckpointRoleEnum.PROCESS_ENTRY` — boundary node where business data
  **enters** the process from an external system (e-shop webhook receive, ERP
  poll, file drop).
- `AuditCheckpointRoleEnum.PROCESS_STEP` — intermediate marker inside a
  business chain (e.g. enrichment, validation, transformation).
- `AuditCheckpointRoleEnum.PROCESS_EXIT` — boundary node where the process
  **delegates** data to its destination (ERP create order, send confirmation
  e-mail).
- Returning `null` (the default on `ANode`) — neutral middle node, no audit
  emission.

### Authoritative-entity rule

`audit-entity` should reference the entity **the node authoritatively
changes/transfers**, not every entity referenced anywhere in the body. In an
"Order to ERP" flow the connector audits `order`, not the products that are
line items inside the order.

### Per-item audit in batch nodes

In `ABatchNode` connectors, **do not** use `dto.addAuditHeader(...)` on the
batch DTO. After the bridge splits the batch, every child message would carry
the union of all audit headers, defeating per-entity Trace queries.

Use the per-item helper instead, which scopes each `audit-entity` to the
single item it represents:

```ts
public async processAction(dto: BatchProcessDto): Promise<BatchProcessDto> {
    const orders = await fetchOrders();
    orders.forEach((o) => dto.addItemWithAudit(
        o,
        'order',
        'id',
        [{ id: o.id, trackingId: o.trackingId }],
    ));
    return dto;
}
```

For items that legitimately and authoritatively touch more than one entity,
pass an `AuditData` map keyed by entity name instead of the `(entity, key,
fields)` triple:

```ts
public async processAction(dto: BatchProcessDto): Promise<BatchProcessDto> {
    const items = await fetchItems();
    items.forEach((it) => {
        dto.addItemWithAudit(it, {
            order:   { key: 'id', fields: [{ id: it.orderId }] },
            invoice: { key: 'id', fields: [{ id: it.invoiceId }] },
        });
    });
    return dto;
}
```

The bridge splits the batch into one message per item, each carrying only its
own `audit-entity` header.

The helper **always merges** the supplied specs with the dto's existing
`audit-entity` header. This keeps batches in the middle of a chain correct:
when a parent split has already propagated a per-item `audit-entity` (via
`CopyBatchItem`), those parent entities are preserved automatically. On
conflict the supplied spec replaces the previous entry for that entity name
(per-entity, last-write-wins).
