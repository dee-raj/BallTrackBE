import prisma from '../../../database';
import { SafeUser, safeUserSelect } from '../../../shared/user';

export class UsersRepository {
  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  /** Returns only users within the same tenant (for admin listing their scorers) */
  async findAll(tenantId: string): Promise<SafeUser[]> {
    return prisma.user.findMany({
      where: { tenantId },
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });
  }

  async findByIdWithPassword(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: { fullName?: string; email?: string; photoUrl?: string }
  ): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /** Create a user within a tenant (used by admin invite flow) */
  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role: string;
    tenantId: string;
  }): Promise<SafeUser> {
    return prisma.user.create({
      data: data as any,
      select: safeUserSelect,
    });
  }
}

export const usersRepository = new UsersRepository();
