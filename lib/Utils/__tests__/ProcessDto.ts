import ProcessDto from '../ProcessDto';
import ResultCode from '../ResultCode';

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
    expect(dto.getHeader('result-message')).toBeUndefined();
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
    dto.setRepeater(2, 20, 10, 'rep-queue', 'rep-message');

    expect(dto.getHeader('repeat-interval')).toEqual('2');
    expect(dto.getHeader('repeat-hops')).toEqual('10');
    expect(dto.getHeader('repeat-max-hops')).toEqual('20');
    expect(dto.getHeader('repeat-queue')).toEqual('rep-queue');
    expect(dto.getHeader('result-code')).toEqual('1001');
    expect(dto.getHeader('result-message')).toEqual('rep-message');

    dto.removeRepeater();
    expect(dto.getHeader('repeat-interval')).toBeUndefined();
    expect(dto.getHeader('repeat-hops')).toBeUndefined();
    expect(dto.getHeader('repeat-max-hops')).toBeUndefined();
    expect(dto.getHeader('repeat-queue')).toBeUndefined();
  });

  it('setRepeater without optional attributes', () => {
    const dto = new ProcessDto();
    dto.setRepeater(3, 30);

    expect(dto.getHeader('result-code')).toEqual('1001');
    expect(dto.getHeader('repeat-interval')).toEqual('3');
    expect(dto.getHeader('repeat-max-hops')).toEqual('30');
    expect(dto.getHeader('repeat-hops')).toBeUndefined();
    expect(dto.getHeader('repeat-queue')).toBeUndefined();
    expect(dto.getHeader('result-message')).toEqual('Repeater applied.');
  });

  it('setRepeater with unsupported parameters', () => {
    const dto = new ProcessDto();
    expect(() => dto.setRepeater(-1, 1)).toThrow(Error);
    expect(() => dto.setRepeater(1, -1)).toThrow(Error);
  });

  it('increment current repeaterHop', () => {
    const dto = new ProcessDto();
    dto.setRepeater(1, 2);
    expect(dto.getHeader('repeat-hops')).toBeUndefined();

    dto.incrementRepeaterHop();
    expect(dto.getHeader('repeat-hops')).toEqual('1');
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
});
