import {getValidJwt} from "../../../src/services/tokens";

describe('getValidJwt()', () => {
  it('should fail on blank authorization token', async () => {
    expect(() => { getValidJwt('') }).toThrowError('no caller-supplied-token');
  });

  it('should fail on non-Bearer authorization token', async () => {
    expect(() => { getValidJwt('not a Bearer') }).toThrowError('must start with \'Bearer \'');
  });

  it('should fail when Bearer prefix is present, but token value isn\'t', async () => {
    expect(() => { getValidJwt('Bearer') }).toThrowError('token is blank or missing');
  });

  it('should fail when Bearer prefix is present, but token value is blank', async () => {
    expect(() => { getValidJwt('Bearer      ') }).toThrowError('token is blank or missing');
  });

  it('should fail on invalid JWT token', async () => {
    expect(() => { getValidJwt('Bearer invalidJwt') }).toThrowError('JWT.decode failed');
  });

  it('should pass on valid JWT token', async () => {
    const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9';
    const payload = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYifQ';
    const signature = 'DUmbnmFG6y-AxpT578vTwVeHoT04LyAwcdhDdvxby_A';

    expect(getValidJwt(`Bearer ${header}.${payload}.${signature}`)).toMatchObject({
      header: {
        kid: 'ABCDEF'
      },
      payload: {
        tid: '123456'
      }
    });
  });
});
