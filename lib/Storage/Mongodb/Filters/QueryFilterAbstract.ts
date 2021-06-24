export interface IQueryFilter {

  getName(): string;

  decorate(type: unknown, query: unknown): void;

  active(activate: boolean): void;
}

export default abstract class QueryFilterAbstract implements IQueryFilter {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _active = true;

  public abstract decorate(type: unknown, query: unknown): void;

  public abstract active(activate: boolean): void;

  public getName = (): string => QueryFilterAbstract.getName();

  public static getName(): string {
    return this.name;
  }
}
