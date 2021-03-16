import * as JWT from "jsonwebtoken";

export const getValidJwt = (authorizationToken: string): any => {
  checkFormat(authorizationToken);

  authorizationToken = authorizationToken.substring(7); // remove 'Bearer '

  const decoded = JWT.decode(authorizationToken, {complete: true});

  if (!decoded) {
    throw new Error('JWT.decode failed, input is likely not a JWT');
  }

  return decoded;
}

const checkFormat = (authorizationToken: string) => {
  if (!authorizationToken) {
    throw new Error('no caller-supplied-token (no authorization header on original request)');
  }

  const [bearerPrefix, token] = authorizationToken.split(' ');

  if ('Bearer' !== bearerPrefix) {
    throw new Error('caller-supplied-token must start with \'Bearer \' (case-sensitive)');
  }

  if (!token || !token.trim()) {
    throw new Error('\'Bearer \' prefix present, but token is blank or missing');
  }
}
