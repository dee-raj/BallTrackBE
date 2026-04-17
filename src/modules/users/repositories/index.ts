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

  async update(id: string, data: { fullName?: string, email?: string, photoUrl?: string }): Promise<SafeUser> {
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
}

export const usersRepository = new UsersRepository();
