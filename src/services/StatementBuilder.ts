import {HttpVerb} from "./http-verbs";
import {Statement} from "aws-lambda";
import {arnToString} from "./resource-arn";
import {getEnvVar} from "./env-utils";

export type Effect = 'Allow' | 'Deny';
export type Action = "execute-api:Invoke" | "execute-api:api:InvalidateCache" | "execute-api:*";

// see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
export default class StatementBuilder {

  private effect: Effect = 'Deny';
  private action: Action = 'execute-api:Invoke';

  // Resource fields
  private regionId: string = getEnvVar('AWS_REGION', 'eu-west-1');
  private accountId: string = getEnvVar('AWS_ACCOUNT_ID', '*');
  private apiId: string = getEnvVar('AWS_APIG_ID', '*');
  private stage: string = getEnvVar('AWS_APIG_STAGE', '*');
  private httpVerb: HttpVerb = '*';
  private resource: string | null = null;
  private childResource: string | null = null;

  /**
   * Setter for the Statement's Effect
   * @param effect - the effect of this Statement
   * @returns StatementBuilder
   */
  public setEffect(effect: Effect): StatementBuilder {
    this.effect = effect;
    return this;
  }

  /**
   * Setter for the Statement's Action
   * @param action - action for this statement
   * @returns StatementBuilder
   */
  public setAction(action: Action): StatementBuilder {
    this.action = action;
    return this;
  }

  /**
   * Setter for the Statement's resource region
   * @param regionId - the ARN's region
   * @returns StatementBuilder
   */
  public setRegionId(regionId: string): StatementBuilder {
    this.regionId = regionId;
    return this;
  }

  /**
   * Setter for the Statement's resource account-id
   * @param accountId - the ARN's account-id
   * @returns StatementBuilder
   */
  public setAccountId(accountId: string): StatementBuilder {
    this.accountId = accountId;
    return this;
  }

  /**
   * Setter for the Statement's resource API id
   * @param apiId - the ARN's API id
   * @returns StatementBuilder
   */
  public setApiId(apiId: string): StatementBuilder {
    this.apiId = apiId;
    return this;
  }

  /**
   * Setter for the Statement's resource stage-name
   * @param stage - the ARN's stage-name
   * @returns StatementBuilder
   */
  public setStage(stage: string): StatementBuilder {
    this.stage = stage;
    return this;
  }

  /**
   * Setter for the Statement's resource HTTP verb
   * @param httpVerb - the ARN's HTTP verb
   * @returns StatementBuilder
   */
  public setHttpVerb(httpVerb: HttpVerb): StatementBuilder {
    this.httpVerb = httpVerb;
    return this;
  }

  /**
   * Setter for the Statement's resource path specifier
   * @param resource - the ARN's path specifier
   * @returns StatementBuilder
   */
  public setResource(resource: string | null): StatementBuilder {
    this.resource = resource;
    return this;
  }

  /**
   * Setter for the Statement's child resource path specifier
   * @param childResource - the ARN's child path specifier
   * @returns StatementBuilder
   */
  public setChildResource(childResource: string | null): StatementBuilder {
    this.childResource = childResource;
    return this;
  }

  /**
   * Builder method to return the built Statement
   * @returns the Statement that has been built
   */
  public build(): Statement {
    const resourceArn = arnToString({
      region: this.regionId,
      accountId: this.accountId,
      apiId: this.apiId,
      stage: this.stage,
      httpVerb: this.httpVerb,
      resource: this.resource,
      childResource: this.childResource
    });

    return {
      Action: this.action as string,
      Effect: this.effect as string,
      Resource: resourceArn
    };
  }
}
