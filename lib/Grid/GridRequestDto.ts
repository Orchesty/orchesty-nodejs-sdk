export interface IGridRequestDto {
  filter: IGridRequestDtoFilter[][],
  sorter: IGridRequestDtoSorter[],
  paging: {
    page: number,
    itemsPerPage: number,
  },
}

export interface IGridRequestDtoFilter {
  column: string,
  operator: Operator,
  value: string[],
}

export interface IGridRequestDtoSorter {
  column: string,
  direction: Direction,
}

export enum Operator {
  EQ = 'EQ',
  NEQ = 'NEQ',
  IN = 'IN',
  NIN = 'NIN',
  GT = 'GT',
  LT = 'LT',
  GTE = 'GTE',
  LTE = 'LTE',
  LIKE = 'LIKE',
  STARTS = 'STARTS',
  ENDS = 'ENDS',
  NEMPTY = 'NEMPTY',
  EMPTY = 'EMPTY',
  BETWEEN = 'BETWEEN',
  NBETWEEN = 'NBETWEEN',
}

export enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}
