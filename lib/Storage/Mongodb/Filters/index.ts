import { IQueryFilter } from './AQueryFilter';
import Deleted from './Impl/Deleted';

const filters: Record<string, IQueryFilter> = {
  [Deleted.getName()]: new Deleted(),
};

export default filters;
