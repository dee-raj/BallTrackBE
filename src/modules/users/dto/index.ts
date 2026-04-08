import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;