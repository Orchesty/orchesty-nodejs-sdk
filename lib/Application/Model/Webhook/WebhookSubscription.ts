export const NAME = 'name';
export const TOPOLOGY = 'topology';

export default class WebhookSubscription {

    public constructor(
        private readonly name: string,
        private readonly node: string,
        private readonly topology: string,
        private readonly parameters: Record<string, string> = {},
    ) {
    }

    public getName(): string {
        return this.name;
    }

    public getNode(): string {
        return this.node;
    }

    public getTopology(): string {
        return this.topology;
    }

    public getParameters(): Record<string, string> {
        return this.parameters;
    }

}
