export enum UserRole {
  superadmin = 'superadmin',
  admin = 'admin',
  scorer = 'scorer',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.superadmin]: 3,
  [UserRole.admin]: 2,
  [UserRole.scorer]: 1,
};