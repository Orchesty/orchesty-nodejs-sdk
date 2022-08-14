export const NAME = 'name';
export const TOPOLOGY = 'topology';

export default class WebhookSubscription {
  public constructor(
    private readonly _name: string,
    private readonly _node: string,
    private readonly _topology: string,
    private readonly _parameters: Record<string, string> = {},
  ) {
  }

  public getName(): string {
    return this._name;
  }

  public getNode(): string {
    return this._node;
  }

  public getTopology(): string {
    return this._topology;
  }

  public getParameters(): Record<string, string> {
    return this._parameters;
  }
}
