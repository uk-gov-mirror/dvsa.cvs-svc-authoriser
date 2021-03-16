import StatementBuilder from "../../../src/services/StatementBuilder";

describe('StatementBuilder', (): void => {
  it('should return default properties if no setters are used', (): void => {
    // cast to 'any' - AWS api-gateway-authorizer.d.ts model
    // gets its knickers in a twist if we use actual 'Statement'
    const statement: any = new StatementBuilder().build();

    expect(statement.Effect).toEqual('Deny');
    expect(statement.Action).toEqual('execute-api:Invoke');
    expect(statement.Resource).toEqual('arn:aws:execute-api:eu-west-1:*:*/*/*');
  });

  it('should correctly build Statement regardless of setter order', (): void => {
    // reverse order
    const statement: any = new StatementBuilder()
      .setHttpVerb('GET')
      .setStage('stage')
      .setApiId('apiId')
      .setAccountId('accountId')
      .setRegionId('us-east-1')
      .setAction('execute-api:Invoke')
      .setEffect('Allow')
      .build();

    expect(statement.Effect).toEqual('Allow');
    expect(statement.Action).toEqual('execute-api:Invoke');
    expect(statement.Resource).toEqual('arn:aws:execute-api:us-east-1:accountId:apiId/stage/GET');
  });

  it('should correctly append resource', (): void => {
    const statement: any = new StatementBuilder()
      .setResource('resource')
      .build();

    expect(statement.Resource).toEqual('arn:aws:execute-api:eu-west-1:*:*/*/*/resource');
  });

  it('should correctly append child resource when resource is present', (): void => {
    const statement: any = new StatementBuilder()
      .setResource('resource')
      .setChildResource('childResource')
      .build();

    expect(statement.Resource).toEqual('arn:aws:execute-api:eu-west-1:*:*/*/*/resource/childResource');
  });

  it('should not append child resource when resource is not present', (): void => {
    const statement: any = new StatementBuilder()
      .setResource(null)
      .setChildResource('childResource')
      .build();

    expect(statement.Resource).toEqual('arn:aws:execute-api:eu-west-1:*:*/*/*');
  });
});
