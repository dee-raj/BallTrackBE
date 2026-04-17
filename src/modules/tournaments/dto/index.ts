import { z } from 'zod';

export const tournamentTypeSchema = z.enum(['league', 'knockout', 'series']);

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  type: tournamentTypeSchema.default('league'),
  pointsPerWin: z.number().int().min(0).default(2),
  pointsPerLoss: z.number().int().min(0).default(0),
  pointsPerDraw: z.number().int().min(0).default(1),
  pointsPerNoResult: z.number().int().min(0).default(1),
});

export type CreateTournamentDto = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = createTournamentSchema.partial();

export type UpdateTournamentDto = z.infer<typeof updateTournamentSchema>;

export const addTeamsSchema = z.object({
  teamIds: z.array(z.string().uuid()),
});

export type AddTeamsDto = z.infer<typeof addTeamsSchema>;
