export const NAME = 'name';
export const TOPOLOGY = 'topology';

/**
 * Catalog entry of a webhook event that an application can subscribe to.
 *
 * The new flow keys subscriptions by `name` only — the topology and node names
 * are supplied by the UI when the user configures a Webhook node in a topology
 * and persisted in the `WebhookConfig` document. The legacy `node` / `topology`
 * constructor arguments remain only for backward compatibility with applications
 * that have not yet been migrated to {@link AWebhookApplication}.
 */
export default class WebhookSubscription {

    public constructor(
        private readonly name: string,
        /** @deprecated node name is supplied by the UI via WebhookConfig */
        private readonly node = '',
        /** @deprecated topology is supplied by the UI via WebhookConfig */
        private readonly topology = '',
        private readonly parameters: Record<string, string> = {},
        private readonly description = '',
    ) {
    }

    /**
     * Preferred factory for the new flow — only `name` and optional `parameters`.
     * The actual topology / node binding is created in the UI and stored in `WebhookConfig`.
     */
    public static create(
        name: string,
        parameters: Record<string, string> = {},
        description = '',
    ): WebhookSubscription {
        return new WebhookSubscription(name, '', '', parameters, description);
    }

    public getName(): string {
        return this.name;
    }

    /** @deprecated read from WebhookConfig persisted by the UI */
    public getNode(): string {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        return this.node;
    }

    /** @deprecated read from WebhookConfig persisted by the UI */
    public getTopology(): string {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        return this.topology;
    }

    public getParameters(): Record<string, string> {
        return this.parameters;
    }

    /**
     * Optional human-readable description of the event. Surfaced in the
     * editor-side picker so the user can pick the right subscription without
     * cross-referencing external API docs. Empty by default.
     */
    public getDescription(): string {
        return this.description;
    }

}
