import prisma from '../../../database';
import { SafeUser, safeUserSelect } from '../../../shared/user';

export class UsersRepository {
  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async findAll(): Promise<SafeUser[]> {
    return prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: { fullName?: string }): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }
}

export const usersRepository = new UsersRepository();
