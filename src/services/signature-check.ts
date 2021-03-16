import * as JWT from "jsonwebtoken";
import {getCertificateChain} from "./azure";

export const checkSignature = async (encodedToken: string, decodedToken: any): Promise<void> => {
  // tid = tenant ID, kid = key ID
  const certificate = await getCertificateChain(decodedToken.payload.tid, decodedToken.header.kid);

  JWT.verify(
    encodedToken,
    certificate,
    {
      audience: decodedToken.payload.aud,
      issuer: decodedToken.payload.iss,
      algorithms: [ "RS256" ]
    }
  );
}
