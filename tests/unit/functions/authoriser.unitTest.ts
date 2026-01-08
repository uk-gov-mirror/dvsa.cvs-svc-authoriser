import { APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";
import { authorizer } from "../../../src/functions/authorizer";
import { IncomingMessage } from "http";
import { APIGatewayAuthorizerResult } from "aws-lambda/trigger/api-gateway-authorizer";
import { getLegacyRoles } from "../../../src/services/roles";
import jwtJson from "../../resources/jwt.json";
import { getValidJwt } from "../../../src/services/tokens";
import { coreFunctionalConfig } from "../../../src/functions/functionalConfig";

const event: APIGatewayTokenAuthorizerEvent = {
  type: "TOKEN",
  authorizationToken: "Bearer myBearerToken",
  methodArn: "arn:aws:execute-api:eu-west-1:*:*/*/*/*",
};

describe("authorizer() unit tests", () => {
  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { AZURE_TENANT_ID: "tenant", AZURE_CLIENT_ID: "client" };
    (getValidJwt as jest.Mock) = jest.fn().mockReturnValue(jwtJson);
  });

  it("should fail on non-2xx HTTP status", async () => {
    (getValidJwt as jest.Mock) = jest.fn().mockRejectedValue({ statusCode: 418, body: "I'm a teapot", options: { url: "http://example.org" }, response: {} as IncomingMessage });

    await expectUnauthorised(event);
  });

  it("should fail on JWT signature check error", async () => {
    (getValidJwt as jest.Mock) = jest.fn().mockRejectedValue(new Error("test-signature-error"));

    await expectUnauthorised(event);
  });

  it("should return valid read-only statements on valid JWT & attach JWT context", async () => {
    const jwtJsonClone = JSON.parse(JSON.stringify(jwtJson));
    jwtJsonClone.payload.roles = ["CVSFullAccess.read"];
    (getValidJwt as jest.Mock) = jest.fn().mockReturnValue(jwtJsonClone);
    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());
    expect(returnValue.context).toEqual({
      ver: "2.0",
      iss: "https://login.microsoftonline.com/9122040d-6c67-4c5b-b112-36a304b66dad/v2.0",
      sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
      aud: "6cb04018-a3f5-46a7-b995-940c78f5aef3",
      exp: 1536361411,
      iat: 1536274711,
      nbf: 1536274711,
      name: "Abe Lincoln",
      preferred_username: "AbeLi@microsoft.com",
      oid: "00000000-0000-0000-66f3-3332eca7ea81",
      tid: "9122040d-6c67-4c5b-b112-36a304b66dad",
      nonce: "123523",
      aio: "Df2UVXL1ix!lMCWMSOJBcFatzcGfvFGhjKv8q5g0x732dR5MB5BisvGQO7YWByjd8iQDLq!eGbIDakyp5mnOrcdqHeYSnltepQmRp6AIZ8jY",
      roles: ["CVSFullAccess.read"],
    });
    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);
    expect(returnValue.policyDocument.Statement.length).toEqual(2);
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: `arn:aws:execute-api:eu-west-1:*:*/*/GET/*`,
    });
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: `arn:aws:execute-api:eu-west-1:*:*/*/HEAD/*`,
    });
  });

  it("should return valid write statements on valid JWT", async () => {
    const jwtJsonClone = JSON.parse(JSON.stringify(jwtJson));
    jwtJsonClone.payload.roles = ["CVSFullAccess.write"];
    (getValidJwt as jest.Mock) = jest.fn().mockReturnValue(jwtJsonClone);

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);

    expect(returnValue.policyDocument.Statement.length).toEqual(1);
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/*/*",
    });
  });

  it("should return valid trailer read statements on valid JWT", async () => {
    const jwtJsonClone = JSON.parse(JSON.stringify(jwtJson));
    jwtJsonClone.payload.roles = ["DVLATrailers.read"];
    (getValidJwt as jest.Mock) = jest.fn().mockReturnValue(jwtJsonClone);

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);

    expect(returnValue.policyDocument.Statement.length).toEqual(4);
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/GET/v1/trailers",
    });
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/GET/v1/trailers/*",
    });
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/HEAD/v1/trailers",
    });
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/HEAD/v1/trailers/*",
    });
  });

  it("should return valid view statement on valid JWT", async () => {
    (getLegacyRoles as jest.Mock) = jest.fn().mockReturnValue([]);
    jwtJson.payload.roles = ["TechRecord.View"];

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);

    expect(returnValue.policyDocument.Statement.length).toEqual(coreFunctionalConfig.length * 2 + 6);
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Allow",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/GET/vehicles/*",
    });
  });

  it("should return multiple statements when multiple roles are valid", async () => {
    (getLegacyRoles as jest.Mock) = jest.fn().mockReturnValue([]);
    jwtJson.payload.roles = ["TechRecord.View", "TechRecord.Amend"];

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);
    expect(returnValue.policyDocument.Statement.length).toEqual(coreFunctionalConfig.length * 2 + 13);
  });

  it("should return an accurate policy based on functional roles", async () => {
    (getLegacyRoles as jest.Mock) = jest.fn().mockReturnValue([]);

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual(jwtJson.payload.sub);
    expect(returnValue.policyDocument.Statement.length).toEqual(coreFunctionalConfig.length * 2 + 13);

    const post: { Action: string; Effect: string; Resource: string } = returnValue.policyDocument.Statement[0] as unknown as { Action: string; Effect: string; Resource: string };
    expect(post.Effect).toEqual("Allow");
    expect(post.Action).toEqual("execute-api:Invoke");
    expect(post.Resource).toEqual("arn:aws:execute-api:eu-west-1:*:*/*/GET/vehicles/*");

    const put: { Action: string; Effect: string; Resource: string } = returnValue.policyDocument.Statement[1] as unknown as { Action: string; Effect: string; Resource: string };
    expect(put.Effect).toEqual("Allow");
    expect(put.Action).toEqual("execute-api:Invoke");
    expect(put.Resource).toEqual("arn:aws:execute-api:eu-west-1:*:*/*/OPTIONS/vehicles/*");
  });

  it("should return an unauthorised policy response", async () => {
    jwtJson.payload.roles = [];

    const returnValue: APIGatewayAuthorizerResult = await authorizer(event, exampleContext());

    expect(returnValue.principalId).toEqual("Unauthorised");

    expect(returnValue.policyDocument.Statement.length).toEqual(1);
    expect(returnValue.policyDocument.Statement).toContainEqual({
      Effect: "Deny",
      Action: "execute-api:Invoke",
      Resource: "arn:aws:execute-api:eu-west-1:*:*/*/*",
    });
  });
});

const expectUnauthorised = async (e: APIGatewayTokenAuthorizerEvent) => {
  await expect(authorizer(e, exampleContext())).resolves.toMatchObject({
    principalId: "Unauthorised",
  });
};

const exampleContext = (): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "test",
    functionVersion: "0.0.0",
    invokedFunctionArn: "arn:aws:execute-api:eu-west-1:TEST",
    memoryLimitInMB: "128",
    awsRequestId: "TEST-AWS-REQUEST-ID",
    logGroupName: "TEST-LOG-GROUP-NAME",
    logStreamName: "TEST-LOG-STREAM-NAME",
    getRemainingTimeInMillis: (): number => 86400000,
    done: (): void => {
      /* circumvent TSLint no-empty */
    },
    fail: (): void => {
      /* circumvent TSLint no-empty */
    },
    succeed: (): void => {
      /* circumvent TSLint no-empty */
    },
  };
};
