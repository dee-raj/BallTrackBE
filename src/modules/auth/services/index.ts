import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../../config';
import { authRepository } from '../repositories';
import { UnauthorizedError, ConflictError, ValidationError } from '../../../middlewares/error_handler';
import type { LoginDto, RegisterDto, ResetPasswordDto } from '../dto';
import prisma from '../../../database';

export class AuthService {
  /**
   * Register a brand-new admin.
   * Creates a Tenant from orgName, then creates the user as admin of that tenant.
   */
  async register(data: RegisterDto) {
    const existingUser = await authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Derive a unique slug from orgName + timestamp
    const slug =
      data.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now();

    // Create the tenant first
    const tenant = await prisma.tenant.create({
      data: { name: data.orgName, slug },
    });

    const passwordHash = await bcrypt.hash(data.password, config.bcrypt.rounds);

    // First user of a tenant is always admin
    const user = await authRepository.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: 'admin',
      tenantId: tenant.id,
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
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
        tenantId: user.tenantId,  // null for superadmin
      },
      token,
    };
  }

  private generateToken(user: {
    id: string;
    email: string;
    role: string;
    tenantId?: string | null;
  }): string {
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? null,
      },
      config.jwt.secret,
      options
    );
  }

  async forgotPassword(data: { email: string }) {
    if (!data?.email) {
      throw new ValidationError('Email is required');
    }
    const user = await authRepository.findByEmail(data.email.trim().toLowerCase());
    if (!user) {
      return { message: 'If an account exists with this email, a reset code has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await authRepository.updateResetToken(data.email, otp, expiry);

    console.log(`[AUTH] Password reset OTP for ${data.email}: ${otp}`);

    return {
      message: 'Password reset code sent to your email.',
      debug_otp: config.nodeEnv === 'development' ? otp : undefined,
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    const user = await authRepository.findByResetToken(data.token);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(data.password, config.bcrypt.rounds);
    await authRepository.updatePassword(user.id, passwordHash);

    return { message: 'Password has been reset successfully' };
  }
}

export const authService = new AuthService();