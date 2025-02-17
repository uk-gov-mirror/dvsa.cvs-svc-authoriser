import { APIGatewayTokenAuthorizerEvent, Context, Statement } from "aws-lambda";
import StatementBuilder from "../services/StatementBuilder";
import { APIGatewayAuthorizerResult } from "aws-lambda/trigger/api-gateway-authorizer";
import { generatePolicy as generateRolePolicy } from "./rolePolicyFactory";
import { generatePolicy as generateFunctionalPolicy } from "./functionalPolicyFactory";
import { getValidJwt } from "../services/tokens";
import { JWT_MESSAGE } from "../models/enums";
import { ILogEvent } from "../models/ILogEvent";
import { envLogger, LogLevel, writeLogMessage } from "../common/Logger";
import newPolicyDocument from "./newPolicyDocument";
import { Jwt, JwtPayload } from "jsonwebtoken";
import { isVersionEndpointRequest } from "../services/version-endpoint-request-checker";
import { generateVersionPolicy } from "./versionPolicyFactory";

/**
 * Lambda custom authorizer function to verify whether a JWT has been provided
 * and to verify its integrity and validity.
 * @param event - AWS Lambda event object
 * @param context - AWS Lambda Context object
 * @returns - Promise<APIGatewayAuthorizerResult>
 */
export const authorizer = async (event: APIGatewayTokenAuthorizerEvent, context: Context): Promise<APIGatewayAuthorizerResult> => {
  const logEvent: ILogEvent = {};

  envLogger(LogLevel.DEBUG, "Invoked authoriser");

  if (!process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID) {
    writeLogMessage(event, logEvent, JWT_MESSAGE.INVALID_ID_SETUP);
    return unauthorisedPolicy();
  }

  envLogger(LogLevel.DEBUG, "AZURE_TENANT_ID and AZURE_CLIENT_ID are set");

  try {
    initialiseLogEvent(event);

    // If the request is for to a /version endpoint, allow it through without checking the JWT
    if (isVersionEndpointRequest(event.methodArn)) {
      envLogger(LogLevel.INFO, "Version endpoint request");
      return generateVersionPolicy();
    }

    envLogger(LogLevel.INFO, "Getting valid JWT");
    const jwt = await getValidJwt(event.authorizationToken, logEvent, process.env.AZURE_TENANT_ID, process.env.AZURE_CLIENT_ID);

    envLogger(LogLevel.INFO, "Generating role policy");
    const policy = generateRolePolicy(jwt, logEvent) ?? generateFunctionalPolicy(jwt);

    if (policy !== undefined) {
      envLogger(LogLevel.INFO, "Role policy generated");
      return policy;
    }

    reportNoValidRoles(jwt, logEvent);
    writeLogMessage(event, logEvent, JWT_MESSAGE.INVALID_ROLES);

    return unauthorisedPolicy();
  } catch (error: any) {
    envLogger(LogLevel.ERROR, "Catch - Error occurred", error);
    writeLogMessage(event, logEvent, error);
    return unauthorisedPolicy();
  }
};

const unauthorisedPolicy = (): APIGatewayAuthorizerResult => {
  const statements: Statement[] = [new StatementBuilder().setEffect("Deny").build()];

  return {
    principalId: "Unauthorised",
    policyDocument: newPolicyDocument(statements),
  };
};

const reportNoValidRoles = (jwt: Jwt, logEvent: ILogEvent): void => {
  const roles = (jwt.payload as JwtPayload).roles;
  if (roles && roles.length === 0) {
    logEvent.message = JWT_MESSAGE.NO_ROLES;
  } else {
    logEvent.message = JWT_MESSAGE.INVALID_ROLES;
  }
};

/**
 * This method is being used in order to clear the ILogEvent, ILogError objects and populate the request url and the time of request
 * @param event
 */
const initialiseLogEvent = (event: APIGatewayTokenAuthorizerEvent): ILogEvent => {
  envLogger(LogLevel.DEBUG, "Init log event");

  return {
    requestUrl: event.methodArn,
    timeOfRequest: new Date().toISOString(),
  } as ILogEvent;
};
