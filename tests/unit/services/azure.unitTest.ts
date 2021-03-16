import nock from "nock";
import {getCertificateChain} from "../../../src/services/azure";

describe('getCertificateChain()', () => {
  it('should return an x5c given an existing key ID', async (): Promise<void> => {
    const publicKey = 'mySuperSecurePublicKey';
    setUpKey('keyToTheKingdom', publicKey);

    await expect(getCertificateChain('tenantId', 'keyToTheKingdom'))
      .resolves.toEqual(`-----BEGIN CERTIFICATE-----\n${publicKey}\n-----END CERTIFICATE-----`);
  });

  it('should throw an error if no key matches the given key ID', async (): Promise<void> => {
    setUpKey('somethingElse', 'mySuperSecurePublicKey');

    await expect(getCertificateChain('tenantId', 'keyToTheKingdom'))
      .rejects.toThrowError('no public key');
  });

  const setUpKey = (keyId: string, publicKey: string) => {
    nock('https://login.microsoftonline.com')
      .get('/tenantId/discovery/keys')
      .reply(200, JSON.stringify({
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: keyId,
            x5t: 'mySuperSecureThumbprint',
            n: 'rsa-n',
            e: 'rsa-e',
            x5c: [ publicKey ]
          }
        ]
      }));
  };
})
