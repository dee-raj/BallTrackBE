import bcrypt from 'bcrypt';
import { usersRepository } from '../repositories';
import { NotFoundError, ValidationError, ConflictError } from '../../../middlewares/error_handler';
import { config } from '../../../config';
import type { UpdateProfileDto, ChangePasswordDto } from '../dto';

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

    const updateData: { fullName?: string, email?: string, photoUrl?: string } = {};

    if (data.fullName) {
      updateData.fullName = data.fullName.trim();
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await usersRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
      updateData.email = data.email.toLowerCase().trim();
    }

    if (data.photoUrl !== undefined) {
      updateData.photoUrl = data.photoUrl ? data.photoUrl.trim() : null as any;
    }

    return usersRepository.update(userId, updateData);
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await usersRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValidPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new ValidationError('Invalid current password');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, config.bcrypt.rounds);
    await usersRepository.updatePassword(userId, passwordHash);

    return { message: 'Password updated successfully' };
  }
}

export const usersService = new UsersService();