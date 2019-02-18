import * as JWT from 'jsonwebtoken';
import * as http from 'request-promise';
import {Configuration} from "../utils/Configuration";
import {resolve} from "path";
import AuthorizationError from "../models/exceptions/AuthorizationError";

class JWTService {

    public static decode(token: string): any {
        return JWT.decode(token);
    }

    public static async verify(token: string): Promise<any> {
        let decodedToken: any = JWT.decode(token, { complete: true });
        let config: any = Configuration.getInstance(resolve(`${__dirname}/../config/config.yml`)).getConfig();

        // Check if config is valid
        if (!config || !config.azure || !config.azure.tennant || !config.azure.appId || !config.azure.issuer || !config.azure.jwk_endpoint) {
            throw new AuthorizationError("Azure configuration is not valid.")
        }

        let endpoint = config.azure.jwk_endpoint.replace(":tennant", config.azure.tennant);
        return JWTService.fetchJWK(endpoint, decodedToken.header.kid)
            .then((x5c: string) => {
                let issuer = config.azure.issuer.replace(":tennant", config.azure.tennant);
                let certificate = `-----BEGIN CERTIFICATE-----\n${x5c}\n-----END CERTIFICATE-----`;

                return JWT.verify(token, certificate, { audience: config.azure.appId, issuer: issuer, algorithms: ['RS256'] });
            })
    }

    public static async fetchJWK(endpoint: string, kid: string): Promise<string> {
        return http.get(endpoint)
        .then((body: string) => {
            return JSON.parse(body);
        })
        .then((JWKs: any) => {
            let key: any = JWKs.keys.find((key: any) => key.kid === kid);

            if (!key) {
                throw new AuthorizationError("No matching public key found.");
            }

            return key.x5c[0];
        })
    }

}

export default JWTService;
