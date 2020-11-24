import { Context, PolicyDocument, Statement } from "aws-lambda";
import StatementBuilder from "../models/IAM/StatementBuilder";
import Policy from "../models/IAM/Policy";
import { JWTService } from "../services/JWTService";
import { Effect } from "../models/IAM/Effect";
import { StatusCodeError } from "request-promise/errors";
import AuthorizationError from "../models/exceptions/AuthorizationError";
import IConfig from "../utils/IConfig";
import getConfig from "../utils/GetConfig";

/**
 * Lambda custom authoriser function to verify whether a JWT has been provided
 * and to verify its integrity and validity.
 * @param event - AWS Lambda event object
 * @param context - AWS Lambda Context object
 * @returns - Promise<Policy | undefined>
 */
const authoriser: any = async (event: any, context: Context): Promise<Policy | undefined> => {
  if (!event.authorizationToken) {
    context.fail(`No authorization methods provided.\nEvent dump:\n${event}\nContext dump:\n${context}`);
    return;
  }

  const [authorization, token] = event.authorizationToken.split(" ");

  if (authorization !== "Bearer") {
    context.fail(`Authorization methods accepted: Bearer.\nEvent dump:\n${event}\nContext dump:\n${context}`);
    return;
  }

  try {
    const config: IConfig = await getConfig();
    const jwtService = new JWTService();
    const result = await jwtService.verify(token, config);
    const statements: Statement[] = [
      new StatementBuilder()
        .setAction("execute-api:Invoke")
        .setEffect(Effect.Allow)
        .setResourceRegion("eu-west-1")
        .setResourceAccountId("*")
        .setResourceApiId("*")
        .setResourceStageName("*")
        .setResourceHttpVerb("*")
        .setResourcePathSpecifier("*")
        .build(),
    ];
    const policyDocument: PolicyDocument = { Version: "2012-10-17", Statement: statements };
    // @ts-ignore
    return new Policy(result.sub, policyDocument);
  } catch (error) {
    if (error instanceof StatusCodeError) {
      console.error(`A ${error.statusCode} error has occurred`);
      console.error(JSON.stringify(error.error));
      return;
    }

    console.warn(error.message);
    const statements: Statement[] = [
      new StatementBuilder()
        .setAction("execute-api:Invoke")
        .setEffect(Effect.Deny)
        .setResourceRegion("eu-west-1")
        .setResourceAccountId("*")
        .setResourceApiId("*")
        .setResourceStageName("*")
        .setResourceHttpVerb("*")
        .setResourcePathSpecifier("*")
        .build(),
    ];
    const policyDocument: PolicyDocument = { Version: "2012-10-17", Statement: statements };

    return new Policy("Unauthorised", policyDocument);
  }
};

export { authoriser };
