import {isVersionEndpointRequest} from "../../../src/services/version-endpoint-request-checker";

describe("Version endpoint request checker", () => {
  test("should return true if the request is for a /version endpoint", () => {
    const methodArn = "arn:aws:execute-api:eu-west-1:123456789012:api-id/stage/GET/version";
    const result = isVersionEndpointRequest(methodArn);
    expect(result).toBe(true);
  });
  test("should return false if the request is not for a /version endpoint", () => {
    const methodArn = "arn:aws:execute-api:eu-west-1:123456789012:api-id/stage/GET/other";
    const result = isVersionEndpointRequest(methodArn);
    expect(result).toBe(false);
  });
});
