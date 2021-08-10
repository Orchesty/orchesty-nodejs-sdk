import { parseHttpMethod} from '../HttpMethods';

describe('Http Methods tests', () => {
  it('should get methods from the enum', () => {
    const typeOfRequest = 'GET';
    expect(parseHttpMethod(typeOfRequest)).toEqual(typeOfRequest);
  });
});
