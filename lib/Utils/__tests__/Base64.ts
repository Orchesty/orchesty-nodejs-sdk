import { decode, encode } from '../Base64';

describe('Base64', () => {
  it('encode ', () => {
    const text = 'jbhfgsfd6g4s 56fsdgg fg';
    expect(encode(text)).toEqual('amJoZmdzZmQ2ZzRzIDU2ZnNkZ2cgZmc=');
  });
  it('decode ', () => {
    const text = 'amJoZmdzZmQ2ZzRzIDU2ZnNkZ2cgZmc=';
    expect(decode(text)).toEqual('jbhfgsfd6g4s 56fsdgg fg');
  });
});
