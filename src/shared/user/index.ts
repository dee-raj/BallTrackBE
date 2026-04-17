import { Prisma } from '@prisma/client';

export const safeUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  fullName: true,
  photoUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

