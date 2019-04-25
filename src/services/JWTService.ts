import * as JWT from "jsonwebtoken";
import * as http from "request-promise";
import {Configuration} from "../utils/Configuration";
import {resolve} from "path";
import AuthorizationError from "../models/exceptions/AuthorizationError";

class JWTService {

    /**
     * Verify the token
     * @param token
     */
    public async verify(token: string): Promise<any> {
        const decodedToken: any = JWT.decode(token, { complete: true });
        const config: any = Configuration.getInstance(resolve(`${__dirname}/../config/config.yml`)).getConfig();

        // Check if config is valid
        if (!config || !config.azure || !config.azure.tennant || !config.azure.appId || !config.azure.issuer || !config.azure.jwk_endpoint) {
            throw new AuthorizationError("Azure configuration is not valid.");
        }

        // Check if the role is correct
        if (!decodedToken.payload.roles && !decodedToken.payload.roles.includes("CVSFullAccess")) {
            throw new AuthorizationError("Invalid roles");
        }

        const endpoint = config.azure.jwk_endpoint.replace(":tennant", config.azure.tennant);
        return this.fetchJWK(endpoint, decodedToken.header.kid)
            .then((x5c: string) => {
                const issuer = config.azure.issuer.replace(":tennant", config.azure.tennant);
                const certificate = `-----BEGIN CERTIFICATE-----\n${x5c}\n-----END CERTIFICATE-----`;

                return JWT.verify(token, certificate, { audience: config.azure.appId, issuer, algorithms: ["RS256"] });
            });
    }

    /**
     * Fetch the public key
     * @param endpoint
     * @param kid
     */
    public async fetchJWK(endpoint: string, kid: string): Promise<string> {
        return http.get(endpoint)
        .then((body: string) => {
            return JSON.parse(body);
        })
        .then((JWKs: any) => {
            const publicKey: any = JWKs.keys.find((key: any) => key.kid === kid);

            if (!publicKey) {
                throw new AuthorizationError("No matching public key found.");
            }

            return publicKey.x5c[0];
        });
    }

}

export { JWTService };
