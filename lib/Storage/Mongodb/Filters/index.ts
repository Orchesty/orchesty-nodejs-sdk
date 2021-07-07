import { IQueryFilter } from './AQueryFilter';
import Deleted from './Impl/Deleted';

const filters: {[key: string]: IQueryFilter} = {
  [Deleted.getName()]: new Deleted(),
};

export default filters;
