import { z } from 'zod';

export const createMatchSchema = z.object({
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  tournamentId: z.string().uuid().optional(),
  matchDate: z.string().datetime(),
  scheduledStartTime: z.string().datetime().optional(),
  venue: z.string().max(255).optional(),
  overs: z.number().int().min(1).max(50).default(50),
  playersPerSide: z.number().int().min(2).max(11).default(11),
});



export type CreateMatchDto = z.infer<typeof createMatchSchema>;

export const tossSchema = z.object({
  matchId: z.string().uuid(),
  tossWinnerId: z.string().uuid(),
  decision: z.enum(['bat', 'field']),
});

export type TossDto = z.infer<typeof tossSchema>;

export const ballSchema = z.object({
  matchId: z.string().uuid(),
  inningsId: z.string().uuid(),
  batsmanPlayerId: z.string().uuid(),
  nonStrikerPlayerId: z.string().uuid(),
  bowlerPlayerId: z.string().uuid(),
  ballType: z.enum(['normal', 'wide', 'no_ball', 'bye', 'leg_bye']),
  runsScored: z.number().int().min(0).max(6),
  wicketType: z.enum(['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'handled_ball', 'obstructing_field', 'timed_out']).optional(),
  wicketPlayerId: z.string().uuid().optional(),
  fielderPlayerId: z.string().uuid().optional(),
  isStrikeRotation: z.boolean().optional(),
});

export type BallDto = z.infer<typeof ballSchema>;

export const ballInputSchema = z.object({
  matchId: z.string().uuid(),
  inningsId: z.string().uuid(),
  batsmanPlayerId: z.string().uuid(),
  nonStrikerPlayerId: z.string().uuid(),
  bowlerPlayerId: z.string().uuid(),
  
  runsOffBat: z.number().int().min(0).max(6),
  extraType: z.enum(['normal', 'wide', 'no_ball', 'bye', 'leg_bye']),
  extraRuns: z.number().int().min(0).max(5).default(0),
  isWicket: z.boolean().default(false),
  wicketType: z.enum(['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'handled_ball', 'obstructing_field', 'timed_out']).optional(),
  fielderPlayerId: z.string().uuid().optional(),
  
  expectedVersion: z.number().int().min(1).optional(),
  requestId: z.string().uuid().optional(),
});

export type BallInputDto = z.infer<typeof ballInputSchema>;

export const startInningsSchema = z.object({
  matchId: z.string().uuid(),
  inningsNumber: z.number().int().min(1).max(2),
  battingTeamId: z.string().uuid(),
  bowlingTeamId: z.string().uuid(),
});

export type StartInningsDto = z.infer<typeof startInningsSchema>;

export const updateMatchStatusSchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum(['scheduled', 'in_progress', 'tea_break', 'second_innings', 'completed', 'abandoned', 'cancelled']),
});

export type UpdateMatchStatusDto = z.infer<typeof updateMatchStatusSchema>;

export const declareInningsSchema = z.object({
  inningsId: z.string().uuid(),
});

export type DeclareInningsDto = z.infer<typeof declareInningsSchema>;