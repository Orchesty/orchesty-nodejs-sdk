export const NAME = 'name';
export const TOPOLOGY = 'topology';

export default class WebhookSubscription {
  public constructor(
    private _name: string,
    private _node: string,
    private _topology: string,
    private _parameters: Record<string, string> = {},
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
