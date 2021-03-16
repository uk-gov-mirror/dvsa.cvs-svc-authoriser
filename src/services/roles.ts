export type Access = 'read' | 'write'

export default interface Role {
  name: string,
  access: Access
}

const backwardsCompatibleRoleNames = [
  'CVSFullAccess',
  'CVSPsvTester',
  'CVSHgvTester',
  'CVSAdrTester',
  'CVSTirTester',
  'VTMAdmin'
];

export const getValidRoles = (token: any): Role[] => {
  const rolesOnToken = token.payload.roles;

  if (!rolesOnToken) {
    return [];
  }

  const validRoles = [];

  for (const role of rolesOnToken) {
    // old role - definitely valid (for now)
    if (backwardsCompatibleRoleNames.includes(role)) {
      validRoles.push(newRole(role, 'write'));
      continue; // < this may need to be removed in future if backwards-compatible role access differs across roles
    }

    // new role - check basic formatting
    const parts = role.split('.');

    if (parts.length !== 2) {
      continue;
    }

    const [ name, access ] = parts;

    if (!name || !access) {
      continue;
    }

    if (['read', 'write'].includes(access.toLowerCase())) {
      validRoles.push(newRole(name, access.toLowerCase()));
    }
  }

  return validRoles;
}

const newRole = (name: string, access: Access): Role => {
  return {
    name,
    access
  }
}
