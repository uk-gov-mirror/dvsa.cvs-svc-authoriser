import * as AWSXRay from "aws-xray-sdk";
import {SecretsManager} from "aws-sdk";
import {GetSecretValueRequest, GetSecretValueResponse} from "aws-sdk/clients/secretsmanager";
import {safeLoad} from "js-yaml";

export interface IConfig {
  azure: {
    tennant: string
    appId: string
    issuer: string
    jwk_endpoint: string
  };
}

export async function getConfig(): Promise<IConfig> {
  const sm = AWSXRay.captureAWSClient(new SecretsManager({region: process.env.AWS_REGION || "eu-west-1"}));
  if (process.env.SECRET_NAME) {
    const req: GetSecretValueRequest = {
      SecretId: process.env.SECRET_NAME
    };
    let resp: GetSecretValueResponse;
    try {
      resp = await sm.getSecretValue(req).promise();
    } catch (e) {
      console.error(`Failed to get secret value for: ${req.SecretId}\nDue To: ${e.message}`);
      throw e;
    }
    return safeLoad(resp.SecretString as string) as IConfig;
  } else {
    throw new Error("SECRET_NAME environment variable not set!");
  }
}
