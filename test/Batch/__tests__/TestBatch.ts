import TestBatch from '../TestBatch';
import ProcessDto from '../../../lib/Utils/ProcessDto';

describe('Tests for TestBatch', () => {
  it('getName', function () {
    const batch = new TestBatch();
    expect(batch.getName()).toEqual('testbatch');
  });

  it('processAction', async function () {
    const batch = new TestBatch();
    const editedDto = await batch.processAction(new ProcessDto());
    const headers = editedDto.headers;
    expect(headers).toEqual({
      "pf-cursor": "testCursor",
      "pf-result-code": "1010"
    })
  });
})
