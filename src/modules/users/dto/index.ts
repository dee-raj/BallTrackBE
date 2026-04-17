import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;