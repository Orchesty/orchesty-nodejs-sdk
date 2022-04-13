import ProcessDto from '../ProcessDto';
import ResultCode from '../ResultCode';
import { WORKER_FOLLOWERS } from '../Headers';

describe('Tests ProcessDto utils', () => {
  it('GetData', () => {
    const json = '{"some": "data"}';
    const dto = new ProcessDto();
    dto.data = json;

    expect(dto.data).toEqual(json);
  });

  it('GetJsonData', () => {
    const dto = new ProcessDto();
    dto.data = '{"some": "data"}';

    expect(dto.jsonData).toEqual({ some: 'data' });
  });

  it('ShouldRemoveBatchCursor', () => {
    const dto = new ProcessDto();
    const cursorName = 'name';
    dto.setBatchCursor(cursorName);
    dto.removeBatchCursor();
    expect(dto.headers['pf-cursor']).toBeUndefined();
  });

  it('setJson', () => {
    const dto = new ProcessDto();
    dto.jsonData = { some: 'data' };

    expect(dto.jsonData).toEqual({ some: 'data' });
  });

  it('GetHeaders', () => {
    const dto = new ProcessDto();
    dto.headers = { 'pf-some': 'header' };

    expect(dto.headers).toEqual({ 'pf-some': 'header' });
  });

  it('GetHeader', () => {
    const dto = new ProcessDto();
    dto.headers = { 'pf-some': 'header' };

    expect(dto.getHeader('some')).toEqual('header');
    expect(dto.getHeader('none', 'default')).toEqual('default');
  });

  it('addHeader', () => {
    const dto = new ProcessDto();
    dto.addHeader('new', 'n-header');

    expect(dto.getHeader('new')).toEqual('n-header');
  });

  it('removeHeader', () => {
    const dto = new ProcessDto();
    dto.addHeader('new', 'n-header');
    dto.removeHeader('new');

    expect(dto.getHeader('new')).toBeUndefined();
  });

  it('removeHeaders', () => {
    const dto = new ProcessDto();
    dto.addHeader('new', 'n-header');
    dto.removeHeaders();

    expect(dto.headers).toEqual({});
  });

  it('setSuccessProcess', () => {
    const dto = new ProcessDto();
    dto.setSuccessProcess('ok');

    expect(dto.getHeader('result-code')).toEqual('0');
    expect(dto.getHeader('result-message')).toEqual('ok');
  });

  it('setSuccessProcess without message', () => {
    const dto = new ProcessDto();
    dto.setSuccessProcess();

    expect(dto.getHeader('result-code')).toEqual('0');
    expect(dto.getHeader('result-message')).toEqual('Message has been processed successfully.');
  });

  it('setStopProcess', () => {
    const dto = new ProcessDto();
    dto.setStopProcess(ResultCode.STOP_AND_FAILED, 'nok');

    expect(dto.getHeader('result-code')).toEqual('1006');
    expect(dto.getHeader('result-message')).toEqual('nok');
  });

  it('setStopProcess with unsupported ResultCode', () => {
    const dto = new ProcessDto();
    expect(() => dto.setStopProcess(10000, 'nok')).toThrow(Error);
  });

  it('setRepeater and removeRepeater', () => {
    const dto = new ProcessDto();
    dto.setRepeater(2, 20, 'rep-message');

    expect(dto.getHeader('repeat-interval')).toEqual('2');
    expect(dto.getHeader('repeat-max-hops')).toEqual('20');
    expect(dto.getHeader('result-code')).toEqual('1001');
    expect(dto.getHeader('result-message')).toEqual('rep-message');

    dto.removeRepeater();
    expect(dto.getHeader('repeat-interval')).toBeUndefined();
    expect(dto.getHeader('repeat-hops')).toBeUndefined();
    expect(dto.getHeader('repeat-max-hops')).toBeUndefined();
  });

  it('setRepeater without optional attributes', () => {
    const dto = new ProcessDto();
    dto.setRepeater(3, 30, 'reason');

    expect(dto.getHeader('result-code')).toEqual('1001');
    expect(dto.getHeader('repeat-interval')).toEqual('3');
    expect(dto.getHeader('repeat-max-hops')).toEqual('30');
    expect(dto.getHeader('repeat-hops')).toBeUndefined();
    expect(dto.getHeader('result-message')).toEqual('reason');
  });

  it('setRepeater with unsupported parameters', () => {
    const dto = new ProcessDto();
    expect(() => dto.setRepeater(-1, 1, 'reason')).toThrow(Error);
    expect(() => dto.setRepeater(1, -1, 'reason')).toThrow(Error);
  });

  it('setLimiter and removeLimiter', () => {
    const dto = new ProcessDto();
    dto.setLimiter('limit-key|user', 60, 10000);

    expect(dto.getHeader('limiter-key')).toEqual('limit-key|user;60;10000');

    dto.removeLimiter();
    expect(dto.getHeader('limiter-key')).toBeUndefined();
  });

  it('setLimiter without optional attributes', () => {
    const dto = new ProcessDto();
    dto.setLimiterWithGroup('limit-key2', 30, 5000, 'group1', 200, 4444);

    expect(dto.getHeader('limiter-key')).toEqual('limit-key2|;30;5000;group1|;200;4444');
  });

  it('removeForceFollowers removes headers correctly', () => {
    const dto = new ProcessDto();
    dto.addHeader(WORKER_FOLLOWERS, '[{"name":"abc", "id": "123"}]');
    dto.setForceFollowers('abc');

    dto.removeForceFollowers();

    expect(dto.headers).toEqual({ 'pf-worker-followers': '[{"name":"abc", "id": "123"}]' });
  });

  it('removeBatchCursor removes iterate-only cursor correctly', () => {
    const dto = new ProcessDto();
    dto.setBatchCursor('0', true);

    dto.removeBatchCursor();

    expect(dto.headers).toEqual({});
  });

  it('removeBatchCursor removes batch-with-cursor cursor correctly', () => {
    const dto = new ProcessDto();
    dto.setBatchCursor('0');

    dto.removeBatchCursor();

    expect(dto.headers).toEqual({});
  });

  it('removeRepeater removes headers correctly', () => {
    const dto = new ProcessDto();
    dto.setRepeater(1, 10, 'reason');

    dto.removeRepeater();

    expect(dto.headers).toEqual({});
  });
});
