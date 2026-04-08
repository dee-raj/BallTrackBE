export enum UserRole {
  admin = 'admin',
  scorer = 'scorer',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.admin]: 2,
  [UserRole.scorer]: 1,
};