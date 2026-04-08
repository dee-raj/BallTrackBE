import { z } from 'zod';

export const createPlayerSchema = z.object({
  fullName: z.string().min(2).max(255),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
});

export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;

export const updatePlayerSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
});

export type UpdatePlayerDto = z.infer<typeof updatePlayerSchema>;

export const addPlayerToTeamSchema = z.object({
  playerId: z.string().uuid(),
  jerseyNumber: z.number().int().min(1).max(999),
  isCaptain: z.boolean().optional(),
});

export type AddPlayerToTeamDto = z.infer<typeof addPlayerToTeamSchema>;

export const removePlayerFromTeamSchema = z.object({
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type RemovePlayerFromTeamDto = z.infer<typeof removePlayerFromTeamSchema>;