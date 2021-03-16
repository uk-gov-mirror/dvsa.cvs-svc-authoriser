import * as jsonWebToken from "jsonwebtoken";
import {getCertificateChain} from "../../../src/services/azure";
import jwtJson from '../../resources/jwt.json';
import {checkSignature} from "../../../src/services/signature-check";

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementationOnce((token, _certificate, _options) => token)
}));

describe('checkSignature()', () => {
  beforeAll(() => {
    (getCertificateChain as jest.Mock) = jest.fn().mockReturnValue('fake certificate');
  });

  it('should successfully verify otken strings', async () => {
    const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9';
    const payload = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYifQ';
    const signature = 'DUmbnmFG6y-AxpT578vTwVeHoT04LyAwcdhDdvxby_A';

    await expect(checkSignature(`${header}.${payload}.${signature}`, jwtJson)).resolves.not.toThrowError();

    expect(jsonWebToken.verify).toBeCalledWith(
      `${header}.${payload}.${signature}`,
      'fake certificate',
      {
        audience: jwtJson.payload.aud,
        issuer: 'https://login.microsoftonline.com/9122040d-6c67-4c5b-b112-36a304b66dad/v2.0',
        algorithms: [ "RS256" ]
      }
    );
  });
});
