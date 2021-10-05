import { Database, Entity, Query } from '@deepkit/orm';
import { IGridRequestDto } from './GridRequestDto';

export abstract class AGrid {

  constructor(private db: Database, private entity: Entity) {
  }

  protected filterableColumns: Record<string, string> | null = null;
  protected sortableColumns: Record<string, string> | null = null;
  protected searchableColumns: string[] | null = null;

  public async filter(dto: IGridRequestDto) {
    await this.db.query(this.entity).filter().find();
  }

  protected searchQuery(query: Query<any>): Query<any> {
    return query;
  }

  private query(): Query<any> {
    return this.db.query(this.entity);
  }

  private buildFilter(dto: IGridRequestDto): object {
    let filter = {};


    return filter;
  }

}
