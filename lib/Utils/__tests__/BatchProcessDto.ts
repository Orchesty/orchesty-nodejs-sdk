import BatchProcessDto from '../BatchProcessDto';
import { BATCH_CURSOR } from '../Headers';

describe('Tests ProcessDto utils', () => {
  it('ShouldRemoveBatchCursor', () => {
    const dto = new BatchProcessDto();
    const cursorName = 'name';
    dto.setBatchCursor(cursorName);
    dto.removeBatchCursor();
    expect(dto.headers[BATCH_CURSOR]).toBeUndefined();
  });

  it('removeBatchCursor removes iterate-only cursor correctly', () => {
    const dto = new BatchProcessDto();
    dto.setBatchCursor('0', true);

    dto.removeBatchCursor();

    expect(dto.headers).toEqual({});
  });

  it('removeBatchCursor removes batch-with-cursor cursor correctly', () => {
    const dto = new BatchProcessDto();
    dto.setBatchCursor('0');

    dto.removeBatchCursor();

    expect(dto.headers).toEqual({});
  });
});
