import { APIGatewayIAMAuthorizerResult, APIGatewayRequestAuthorizerEventV2, Context, Statement } from "aws-lambda";
import StatementBuilder from "../services/StatementBuilder";
import { generatePolicy as generateRolePolicy } from "./rolePolicyFactory";
import { generatePolicy as generateFunctionalPolicy } from "./functionalPolicyFactory";
import { getValidJwt } from "../services/tokens";
import { JWT_MESSAGE } from "../models/enums";
import { ILogEvent } from "../models/ILogEvent";
import { envLogger, LogLevel, writeLogMessage } from "../common/Logger";
import newPolicyDocument from "./newPolicyDocument";
import { Jwt, JwtPayload } from "jsonwebtoken";

/**
 * Lambda custom authorizer function to verify whether a JWT has been provided
 * and to verify its integrity and validity.
 * @param event - AWS Lambda event object
 * @param context - AWS Lambda Context object
 * @returns - Promise<APIGatewayIAMAuthorizerResult>
 */
export const authorizer = async (event: APIGatewayRequestAuthorizerEventV2, context: Context): Promise<APIGatewayIAMAuthorizerResult> => {
  const logEvent: ILogEvent = {};

  envLogger(LogLevel.DEBUG, "Invoked authoriser");

  if (!process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID) {
    writeLogMessage(event, logEvent, JWT_MESSAGE.INVALID_ID_SETUP);
    return unauthorisedPolicy();
  }

  envLogger(LogLevel.DEBUG, "AZURE_TENANT_ID and AZURE_CLIENT_ID are set");

  try {
    initialiseLogEvent(event);

    envLogger(LogLevel.INFO, "Getting valid JWT");
    const jwt = await getValidJwt(getAuthorizationToken(event), logEvent, process.env.AZURE_TENANT_ID, process.env.AZURE_CLIENT_ID);

    envLogger(LogLevel.INFO, "Generating role policy");
    const policy = generateRolePolicy(jwt, logEvent) ?? generateFunctionalPolicy(jwt, logEvent);

    if (policy !== undefined) {
      envLogger(LogLevel.INFO, "Role policy generated");

      const payload = jwt.payload as JwtPayload;

      policy.context = {
        username: payload.name,
        msOid: payload.oid,
        employeeId: payload.employeeid ?? payload.employeeId,
        email: payload.email ?? payload.preferred_username ?? payload.upn,
      };

      return policy;
    }

    reportNoValidRoles(jwt, event, context, logEvent);
    writeLogMessage(event, logEvent, JWT_MESSAGE.INVALID_ROLES);

    return unauthorisedPolicy();
  } catch (error: any) {
    envLogger(LogLevel.ERROR, "Catch - Error occurred", error);
    writeLogMessage(event, logEvent, error);
    return unauthorisedPolicy();
  }
};

const unauthorisedPolicy = (): APIGatewayIAMAuthorizerResult => {
  const statements: Statement[] = [new StatementBuilder().setEffect("Deny").build()];

  return {
    principalId: "Unauthorised",
    policyDocument: newPolicyDocument(statements),
  };
};

const reportNoValidRoles = (jwt: Jwt, event: APIGatewayRequestAuthorizerEventV2, context: Context, logEvent: ILogEvent): void => {
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
const initialiseLogEvent = (event: APIGatewayRequestAuthorizerEventV2): ILogEvent => {
  envLogger(LogLevel.DEBUG, "Init log event");

  return {
    requestUrl: event.routeArn,
    timeOfRequest: new Date().toISOString(),
  } as ILogEvent;
};

const getAuthorizationToken = (event: APIGatewayRequestAuthorizerEventV2): string => {
  const authorizationHeader = event.headers?.authorization ?? event.headers?.Authorization;

  if (authorizationHeader) {
    return authorizationHeader;
  }

  const bearerIdentitySource = event.identitySource?.find((identitySource) => identitySource?.startsWith("Bearer "));
  if (bearerIdentitySource) {
    return bearerIdentitySource;
  }

  return event.identitySource?.find((identitySource) => !!identitySource?.trim()) ?? "";
};
