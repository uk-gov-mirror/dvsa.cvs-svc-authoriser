import { APIGatewayAuthorizerResult, Statement } from "aws-lambda";
import newPolicyDocument from "./newPolicyDocument";
import StatementBuilder from "../services/StatementBuilder";
import { HttpVerb } from "../services/http-verbs";

export function generateVersionPolicy(): APIGatewayAuthorizerResult {
  const statements: Statement[] = [
    {
      verb: "GET",
      // Match any stage ending in /version with a wild-carded route preceding it
      // e.g. /defects/version
      path: "*/version",
    },
  ]
    .map((i) =>
      new StatementBuilder()
        .setEffect("Allow")
        .setHttpVerb(i.verb as HttpVerb)
        .setResource(i.path)
        .build()
    )
    .flat();

  return {
    principalId: "version",
    policyDocument: newPolicyDocument(statements),
  };
}
