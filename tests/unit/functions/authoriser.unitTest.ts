import {APIGatewayTokenAuthorizerEvent, Context} from "aws-lambda";
import {StatusCodeError} from "request-promise/errors";
import {authorizer} from "../../../src/functions/authorizer";
import {IncomingMessage} from "http";
import {APIGatewayAuthorizerResult} from "aws-lambda/trigger/api-gateway-authorizer";
import {checkSignature} from "../../../src/services/signature-check";
import {getValidRoles} from "../../../src/services/roles";
import jwtJson from '../../resources/jwt.json';
import {getValidJwt} from "../../../src/services/tokens";
import {configuration} from "../../../src/services/configuration";
import * as fs from "fs";
import {safeLoad} from "js-yaml";
import {availableHttpVerbs, isSafe} from "../../../src/services/http-verbs";

const event: APIGatewayTokenAuthorizerEvent = {
  type: 'TOKEN',
  authorizationToken: 'Bearer myBearerToken',
  methodArn: 'arn:aws:execute-api:eu-west-1:*:*/*/*/*'
};

describe('authorizer() unit tests', () => {

  beforeEach(() => {
    (configuration as jest.Mock) = jest.fn().mockReturnValue(safeLoad(fs.readFileSync('tests/resources/config-test.yml', 'utf-8')));

    (getValidJwt as jest.Mock) = jest.fn().mockReturnValue(jwtJson);

    (getValidRoles as jest.Mock) = jest.fn().mockReturnValue([{
      name: 'a-role',
      access: 'read'
    }]);

    (checkSignature as jest.Mock) = jest.fn().mockImplementation(() => {
      /* circumvent TSLint no-empty */
    });
  })

  it('should fail on non-2xx HTTP status', async () => {
    (checkSignature as jest.Mock) = jest.fn().mockRejectedValue(
      new StatusCodeError(418, 'I\'m a teapot', { url: 'http://example.org' }, {} as IncomingMessage)
    );

    await expectUnauthorised(event);
  });

  it('should fail on JWT signature check error', async () => {
    (checkSignature as jest.Mock) = jest.fn().mockRejectedValue(
      new Error('test-signature-error')
    );

    await expectUnauthorised(event);
  });

  it('should return valid read-only statements on valid JWT', async () => {
    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);

    for (const httpVerb of availableHttpVerbs()) {
      if (isSafe(httpVerb)) {
        expect(returnValue.policyDocument.Statement).toContainEqual({
          Effect: 'Allow',
          Action: 'execute-api:Invoke',
          Resource: `arn:aws:execute-api:eu-west-1:*:*/*/${httpVerb}/a-resource/with-child`
        });
      }
    }
  });

  it('should return valid write statements on valid JWT', async () => {
    (getValidRoles as jest.Mock) = jest.fn().mockReturnValue([{
      name: 'a-role',
      access: 'write'
    }]);

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);

    expect(returnValue.policyDocument.Statement.length).toEqual(1);
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: 'Allow',
      Action: 'execute-api:Invoke',
      Resource: 'arn:aws:execute-api:eu-west-1:*:*/*/*/a-resource/with-child'
    });
  });
});

const expectUnauthorised = async (e: APIGatewayTokenAuthorizerEvent) => {
  await expect(authorizer(e, exampleContext())).resolves.toMatchObject({
    principalId: 'Unauthorised'
  });
};

const exampleContext = (): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test',
    functionVersion: '0.0.0',
    invokedFunctionArn: 'arn:aws:execute-api:eu-west-1:TEST',
    memoryLimitInMB: '128',
    awsRequestId: 'TEST-AWS-REQUEST-ID',
    logGroupName: 'TEST-LOG-GROUP-NAME',
    logStreamName: 'TEST-LOG-STREAM-NAME',
    getRemainingTimeInMillis: (): number => 86400000,
    done: (): void => { /* circumvent TSLint no-empty */ },
    fail: (): void => { /* circumvent TSLint no-empty */ },
    succeed: (): void => { /* circumvent TSLint no-empty */ },
  };
};
