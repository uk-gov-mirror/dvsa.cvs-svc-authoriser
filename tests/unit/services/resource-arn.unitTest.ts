import {arnToString, ResourceArn, stringToArn} from "../../../src/services/resource-arn";

describe('arnToString()', () => {
  it('should return correct string representation of ARN', () => {
    const arn: ResourceArn = {
      region: 'eu-west-1',
      accountId: '1234',
      apiId: 'cafe-babe',
      stage: 'develop',
      httpVerb: 'GET',
      resource: 'myResource',
      childResource: 'my/child/resource'
    }

    expect(arnToString(arn)).toEqual('arn:aws:execute-api:eu-west-1:1234:cafe-babe/develop/GET/myResource/my/child/resource');
  });
});

describe('stringToArn()', () => {
  it('should return correct ARN representation of string', () => {
    const arn = 'arn:aws:execute-api:eu-west-1:1234:cafe-babe/develop/GET/myResource/my/child/resource';

    expect(stringToArn(arn)).toEqual({
      region: 'eu-west-1',
      accountId: '1234',
      apiId: 'cafe-babe',
      stage: 'develop',
      httpVerb: 'GET',
      resource: 'myResource',
      childResource: 'my/child/resource'
    });
  });
});
