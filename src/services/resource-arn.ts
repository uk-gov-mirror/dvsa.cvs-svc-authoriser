import {HttpVerb, toHttpVerb} from "./http-verbs";

export interface ResourceArn {
  region: string
  accountId: string,
  apiId: string,
  stage: string,
  httpVerb: HttpVerb,
  resource: string | null,
  childResource: string | null
}

export const arnToString = (input: ResourceArn): string => {
  let toString = `arn:aws:execute-api:${input.region}:${input.accountId}:${input.apiId}/${input.stage}/${input.httpVerb}`;

  if (input.resource) {
    toString += `/${input.resource}`;

    if (input.childResource) {
      toString += `/${input.childResource}`;
    }
  }

  return toString;
}

export const stringToArn = (input: string): ResourceArn => {
  if (!input || !input.trim()) {
    throw new Error('ARN is null or blank')
  }

  const parts = input.split(':');

  if (parts.length !== 6) {
    throw new Error('ARN does not consist of six colon-delimited parts');
  }

  if (parts[0] !== 'arn') {
    throw new Error('ARN part 0 should be exact string \'arn\'');
  }

  if (parts[1] !== 'aws') {
    throw new Error('ARN part 1 should be exact string \'aws\'');
  }

  if (parts[2] !== 'execute-api') {
    throw new Error('ARN part 2 is not \'execute-api\' - this is not an API Gateway ARN');
  }

  const pathParts = parts[5].split('/');

  if (pathParts.length < 3) {
    throw new Error('ARN path should consist of at least three parts: /{apiId}/{stage}/{httpVerb}/');
  }

  let resource = null;
  if (pathParts.length >= 4) {
    resource = pathParts[3];
  }

  let childResource = null;
  if (pathParts.length >= 5) {
    childResource = pathParts.slice(4).join('/');
  }

  return {
    region: parts[3],
    accountId: parts[4],
    apiId: pathParts[0],
    stage: pathParts[1],
    httpVerb: toHttpVerb(pathParts[2]),
    resource,
    childResource
  }
}
