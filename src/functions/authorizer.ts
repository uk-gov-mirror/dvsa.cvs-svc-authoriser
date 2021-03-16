import {APIGatewayTokenAuthorizerEvent, Context, PolicyDocument, Statement} from "aws-lambda";
import StatementBuilder from "../services/StatementBuilder";
import {APIGatewayAuthorizerResult} from "aws-lambda/trigger/api-gateway-authorizer";
import {checkSignature} from "../services/signature-check";
import Role, {getValidRoles} from "../services/roles";
import {getValidJwt} from "../services/tokens";
import {AuthorizerConfig, configuration, getAssociatedResources} from "../services/configuration";
import {availableHttpVerbs, isSafe} from "../services/http-verbs";

/**
 * Lambda custom authorizer function to verify whether a JWT has been provided
 * and to verify its integrity and validity.
 * @param event - AWS Lambda event object
 * @param context - AWS Lambda Context object
 * @returns - Promise<APIGatewayAuthorizerResult>
 */
export const authorizer = async (event: APIGatewayTokenAuthorizerEvent, context: Context): Promise<APIGatewayAuthorizerResult> => {
  try {
    // fail-fast if config is missing or invalid
    const config: AuthorizerConfig = await configuration();

    const jwt: any = getValidJwt(event.authorizationToken);

    const validRoles: Role[] = getValidRoles(jwt);

    if (validRoles.length === 0) {
      reportNoValidRoles(jwt, event, context);
      return unauthorisedPolicy();
    }

    // by this point we know authorizationToken meets formatting requirements
    // remove 'Bearer ' when verifying signature
    await checkSignature(event.authorizationToken.substring(7), jwt);

    let statements: Statement[] = [];

    for (const role of validRoles) {
      const items = roleToStatements(role, config);
      statements = statements.concat(items);
    }

    return {
      principalId: jwt.payload.sub,
      policyDocument: newPolicyDocument(statements)
    }
  } catch (error: any) {
    console.error(error.message);
    dumpArguments(event, context);

    return unauthorisedPolicy();
  }
};

const roleToStatements = (role: Role, config: AuthorizerConfig): Statement[] => {
  const associatedResources: string[] = getAssociatedResources(role, config);

  let statements: Statement[] = [];

  for (const associatedResource of associatedResources) {
    const parts = associatedResource.substring(1).split('/');
    const resource = parts[0];

    let childResource = null;

    if (parts.length > 1) {
      childResource = parts.slice(1).join('/');
    }

    if (role.access === 'read') {
      statements = statements.concat(readRoleToStatements(resource, childResource));
    } else {
      statements.push(writeRoleToStatement(resource, childResource));
    }
  }

  return statements;
}

const readRoleToStatements = (resource: string, childResource: string | null): Statement[] => {
  const statements: Statement[] = [];

  for (const httpVerb of availableHttpVerbs()) {
    if (isSafe(httpVerb)) {
      statements.push(new StatementBuilder()
        .setEffect('Allow')
        .setHttpVerb(httpVerb)
        .setResource(resource)
        .setChildResource(childResource)
        .build()
      );
    }
  }

  return statements;
}

const writeRoleToStatement = (resource: string, childResource: string | null): Statement => {
  return new StatementBuilder()
    .setEffect('Allow')
    .setHttpVerb('*')
    .setResource(resource)
    .setChildResource(childResource)
    .build();
}

const unauthorisedPolicy = (): APIGatewayAuthorizerResult => {
  const statements: Statement[] = [
    new StatementBuilder()
      .setEffect('Deny')
      .build()
  ];

  return {
    principalId: 'Unauthorised',
    policyDocument: newPolicyDocument(statements)
  }
}

const newPolicyDocument = (statements: Statement[]): PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: statements
  }
}

const reportNoValidRoles = (jwt: any, event: APIGatewayTokenAuthorizerEvent, context: Context): void => {
  const roles = jwt.payload.roles;
  if (roles && roles.length === 0) {
    console.error('no valid roles on token (token has no roles at all)');
  } else {
    console.error(`no valid roles on token (${roles.length} invalid role(s): ${roles})`);
  }
  dumpArguments(event, context);
}

const dumpArguments = (event: APIGatewayTokenAuthorizerEvent, context: Context): void => {
  console.error('Event dump  : ', JSON.stringify(event));
  console.error('Context dump: ', JSON.stringify(context));
}
