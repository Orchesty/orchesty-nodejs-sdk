export interface IQueryFilter {

  getName(): string;

  decorate(type: unknown, query: unknown): void;

  active(activate: boolean): void;
}

export default abstract class AQueryFilter implements IQueryFilter {
  protected _active = true;

  public abstract decorate(type: unknown, query: unknown): void;

  public abstract active(activate: boolean): void;

  public getName = (): string => AQueryFilter.getName();

  public static getName(): string {
    return this.name;
  }
}
