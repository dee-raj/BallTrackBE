import { usersRepository } from '../repositories';
import { NotFoundError } from '../../../middlewares/error_handler';
import type { UpdateProfileDto } from '../dto';

export class UsersService {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getAllUsers() {
    return usersRepository.findAll();
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData: { fullName?: string } = {};
    if (data.fullName) {
      updateData.fullName = data.fullName;
    }

    return usersRepository.update(userId, updateData);
  }
}

export const usersService = new UsersService();