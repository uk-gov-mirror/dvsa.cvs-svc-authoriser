import {AuthorizerConfig, configuration, getAssociatedResources, validate} from "../../../src/services/configuration";
import Role from "../../../src/services/roles";

const mockConfig: AuthorizerConfig = {
  roleToResources: [
    {
      roleName: 'a-role',
      associatedResources: [
        '/a-resource/with-child'
      ]
    }
  ]
};

describe('getAssociatedResources()', () => {
  const mockRole: Role = {
    name: 'a-role',
    access: 'read'
  }

  it('should return associated resources given role name', () => {
    const associatedResources: string[] = getAssociatedResources(mockRole, mockConfig);
    expect(associatedResources.length).toEqual(1);
    expect(associatedResources).toContainEqual('/a-resource/with-child');
  });

  it('should return empty array of role name not found', () => {
    const associatedResources: string[] = getAssociatedResources(mockRole, { roleToResources: [] });
    expect(associatedResources.length).toEqual(0);
  });
})

describe("configuration()", () => {
  it('should successfully return any default configuration', (): void => {
    expect(configuration()).resolves.toBeDefined();
  });

  it('should successfully validate configuration if it\'s valid', (): void => {
    expect(validate(mockConfig)).toEqual(mockConfig);
  });

  it('should fail if configuration object is null', (): void => {
    // @ts-ignore
    expect((): void => validate(null)).toThrowError('configuration is null or blank');
  });

  it('should fail if configuration.roleToResources is null', (): void => {
    // @ts-ignore
    expect((): void => validate({})).toThrowError('missing required field');
  });

  it('should fail if configuration.roleToResources.resourceMapping.roleName is missing', (): void => {
    const missingRoleName: any = {
      roleToResources: [
        {
          associatedResources: [
            '/a-resource/with-child'
          ]
        }
      ]
    };

    // @ts-ignore
    expect((): void => validate(missingRoleName)).toThrowError('missing required field');
  });

  it('should fail if configuration.roleToResources.resourceMapping.associatedResources is missing', (): void => {
    const missingAssociatedResources: any = {
      roleToResources: [
        {
          roleName: 'a-role',
        }
      ]
    };

    // @ts-ignore
    expect((): void => validate(missingAssociatedResources)).toThrowError('missing required field');
  });

  it('should fail if configuration.roleToResources.resourceMapping.associatedResources is empty', (): void => {
    const missingAssociatedResources: any = {
      roleToResources: [
        {
          roleName: 'a-role',
          associatedResources: []
        }
      ]
    };

    // @ts-ignore
    expect((): void => validate(missingAssociatedResources)).toThrowError('at least 1');
  });

  it('should fail if configuration.roleToResources.resourceMapping.associatedResources elements are null', (): void => {
    const missingAssociatedResources: any = {
      roleToResources: [
        {
          roleName: 'a-role',
          associatedResources: [ null ]
        }
      ]
    };

    // @ts-ignore
    expect((): void => validate(missingAssociatedResources)).toThrowError('contains null or blank');
  });

  it('should fail if configuration.roleToResources.resourceMapping.associatedResources elements are blank', (): void => {
    const missingAssociatedResources: any = {
      roleToResources: [
        {
          roleName: 'a-role',
          associatedResources: [ '' ]
        }
      ]
    };

    // @ts-ignore
    expect((): void => validate(missingAssociatedResources)).toThrowError('contains null or blank');
  });

  it('should fail if configuration.roleToResources.resourceMapping.associatedResources elements don\' start with slash', (): void => {
    const missingAssociatedResources: any = {
      roleToResources: [
        {
          roleName: 'a-role',
          associatedResources: [ 'doesn\'-start-with-a-slash' ]
        }
      ]
    };

    // @ts-ignore
    expect((): void => validate(missingAssociatedResources)).toThrowError('does not start with');
  });
});
