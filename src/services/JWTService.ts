import * as JWT from 'jsonwebtoken';
import * as http from 'request-promise';

import AuthorizationError from '../models/exceptions/AuthorizationError';
import { ERRORMESSAGES, ALLOWED_CVS_ROLES } from '../models/';
import IConfig from '../utils/IConfig';

class JWTService {
  /**
   * Verify the token
   * @param token
   * @param config
   */
  public async verify(token: string, config: IConfig): Promise<string | object> {
    const decodedToken: any = JWT.decode(token, { complete: true });

    // Check if config is valid
    if (
      !config ||
      !config.azure ||
      !config.azure.tennant ||
      !config.azure.appId ||
      !config.azure.issuer ||
      !config.azure.jwk_endpoint
    ) {
      throw new AuthorizationError(ERRORMESSAGES.AZURE_CONFIGURATION_NOT_VALID);
    }

    if (!this.isAtLeastOneRoleValid(decodedToken)) {
      throw new AuthorizationError('Invalid roles');
    }

    const endpoint = config.azure.jwk_endpoint.replace(':tennant', config.azure.tennant);
    const {
      header: { kid }
    } = decodedToken;
    const { aud: audience } = decodedToken.payload;

    try {
      const x5c = await this.fetchJWK(endpoint, kid);
      const issuer = config.azure.issuer.replace(':tennant', config.azure.tennant);
      const certificate = `-----BEGIN CERTIFICATE-----\n${x5c}\n-----END CERTIFICATE-----`;

      return JWT.verify(token, certificate, { audience, issuer, algorithms: ['RS256'] });
    } catch (e) {
      console.error('failed getting the certificate');
      console.log(JSON.stringify(e, null, 2));
      throw e;
    }
  }

  /**
   * Internal function used to determine if the user has a valid role. Not directly exposed
   * @param decodedToken
   */
  public isAtLeastOneRoleValid(decodedToken: any): boolean {
    const {
      payload: { roles }
    } = decodedToken;

    return roles ? ALLOWED_CVS_ROLES.some((r) => roles.includes(r)) : false;
  }

  /**
   * Fetch the public key
   * @param endpoint
   * @param kid
   */
  public async fetchJWK(endpoint: string, kid: string): Promise<string> {
    try {
      const body = await http.get(endpoint);
      const JWKs = JSON.parse(body);
      const publicKey: any = JWKs.keys.find((key: any) => key.kid === kid);

      if (!publicKey) {
        throw new AuthorizationError(ERRORMESSAGES.NO_MATCHING_PUBLIC_KEY_FOUND);
      }
      return publicKey.x5c[0];
    } catch (e) {
      console.log('error in fetchJWK');
      console.log(JSON.stringify(e, null, 2));
      throw e;
    }
  }
}

export { JWTService };
