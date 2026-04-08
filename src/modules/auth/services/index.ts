import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../../config';
import { authRepository } from '../repositories';
import { UnauthorizedError, ConflictError } from '../../../middlewares/error_handler';
import type { LoginDto, RegisterDto } from '../dto';

export class AuthService {
  async register(data: RegisterDto) {
    const existingUser = await authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, config.bcrypt.rounds);

    const user = await authRepository.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async login(data: LoginDto) {
    const user = await authRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  private generateToken(user: { id: string; email: string; role: string }): string {
    const options: SignOptions = {
      expiresIn: '7d',
    };
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      options
    );
  }
}

export const authService = new AuthService();