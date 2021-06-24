import TestBatch from '../TestBatch';
import ProcessDTO from '../../../lib/Utils/ProcessDTO';

describe('Tests for TestBatch', () => {

  it('getName', function () {
    const batch = new TestBatch();
    expect(batch.getName()).toEqual('testbatch');
  });

  it('processAction', async function () {
    const batch = new TestBatch();
    const editedDto = await batch.processAction(new ProcessDTO());
    const headers = editedDto.getHeaders();
    expect(headers).toEqual({
      "pf-cursor": "testCursor",
      "pf-result-code": "1010"
    })
  });

})
