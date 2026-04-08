import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2).max(255),
  shortName: z.string().min(1).max(10).optional(),
  homeGround: z.string().max(255).optional(),
  logoUrl: z.string().url().optional(),
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  shortName: z.string().min(1).max(10).optional(),
  homeGround: z.string().max(255).optional(),
  logoUrl: z.string().url().optional(),
});

export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;