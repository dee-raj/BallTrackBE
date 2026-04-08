import prisma from '../../../database';
import { User } from '@prisma/client';

export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: { fullName?: string }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export const usersRepository = new UsersRepository();