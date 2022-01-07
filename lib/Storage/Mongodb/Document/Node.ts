import ADeletableDocument from './ADeletableDocument';

interface ISystemConfigs {
    sdk: {
        host: string,
    },
    bridge: {
        host: string,
    },
    rabbit: {
        prefetch: string,
    },
    repeater: {
        enabled: boolean,
        hops: number,
        interval: number,
    }
}

export default class Node extends ADeletableDocument {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected systemConfigs?: string;

  public getSystemConfigsFromString(): ISystemConfigs | undefined {
    if (this.systemConfigs) {
      return JSON.parse(this.systemConfigs) as ISystemConfigs;
    }
    return undefined;
  }

  public getSystemConfigs(): string | undefined {
    return this.systemConfigs;
  }

  public setConfigs(systemConfigs: ISystemConfigs): Node {
    this.systemConfigs = JSON.stringify(systemConfigs);
    return this;
  }
}
