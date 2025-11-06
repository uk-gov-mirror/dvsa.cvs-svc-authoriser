import { decode, Jwt, JwtPayload, verify } from "jsonwebtoken";
import { JWT_MESSAGE } from "../models/enums";
import { ILogEvent } from "../models/ILogEvent";
import { checkSignature } from "./signature-check";

interface CVSJWTPayload extends JwtPayload {
  unique_name: string;
  preferred_username: string;
}

export const getValidJwt = async (authorizationToken: string | undefined, logEvent: ILogEvent, tenantId: string, clientId: string): Promise<Jwt> => {
  if (!authorizationToken) {
    throw new Error(JWT_MESSAGE.NO_AUTH_HEADER);
  }

  const [bearerPrefix, token] = authorizationToken.split(" ");

  if ("Bearer" !== bearerPrefix) {
    throw new Error(JWT_MESSAGE.NO_BEARER_PREFIX);
  }

  if (!token || !token.trim()) {
    throw new Error(JWT_MESSAGE.BLANK_TOKEN);
  }

  authorizationToken = authorizationToken.substring(7); // remove 'Bearer '

  const decoded: Jwt | null = decode(authorizationToken, { complete: true });

  if (!decoded) {
    throw new Error(JWT_MESSAGE.DECODE_FAILED);
  }

  let username;
  const payload = decoded.payload as CVSJWTPayload;

  if (!payload) {
    username = "No data available in token";
  } else {
    if (payload.preferred_username) {
      username = payload.preferred_username;
    } else {
      username = payload.unique_name;
    }
  }

  logEvent.email = username;
  logEvent.roles = (decoded.payload as JwtPayload).roles;
  logEvent.tokenExpiry = new Date((payload.exp as number) * 1000).toISOString();

  await checkSignature(authorizationToken, decoded, tenantId, clientId);

  return decoded;
};
