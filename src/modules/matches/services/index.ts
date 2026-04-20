import { Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../../../middlewares/error_handler';
import prisma from '../../../database';
import type {
  CreateMatchDto,
  UpdateMatchDto,
  TossDto,
  BallInputDto,
  StartInningsDto,
  DeclareInningsDto,
} from '../dto';
import { emitBallAdded, emitBallRemoved, emitInningsEnd, emitOverComplete } from '../../../shared/realtime';

type DbClient = Prisma.TransactionClient;
type InningsEndReason = 'all_out' | 'target_reached' | 'overs_complete' | 'declared';

interface BallResult {
  totalRuns: number;
  extras: number;
  isLegal: boolean;
}

interface RecordBallTransactionResult {
  ball: Awaited<ReturnType<DbClient['ball']['create']>>;
  innings: Awaited<ReturnType<DbClient['innings']['findUnique']>>;
  match: Awaited<ReturnType<DbClient['match']['findUnique']>>;
  overNumber: number;
  emitOverEnd: boolean;
  inningsEndReason?: InningsEndReason;
}

function isLegalDelivery(ballType: string): boolean {
  return ballType !== 'wide' && ballType !== 'no_ball';
}

function toOversNotation(legalBalls: number): number {
  return Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;
}

function getRunRate(totalRuns: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  return parseFloat((totalRuns / (legalBalls / 6)).toFixed(2));
}

/** Asserts a match belongs to the given tenant. Throws ForbiddenError otherwise. */
async function assertMatchTenant(
  db: DbClient,
  matchId: string,
  tenantId: string
) {
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) throw new NotFoundError('Match not found');
  if (match.tenantId !== tenantId) throw new ForbiddenError('Access denied');
  return match;
}

async function recomputeInnings(db: DbClient, inningsId: string, maxWickets: number = 10): Promise<void> {
  const balls = await db.ball.findMany({
    where: { inningsId },
    orderBy: { sequenceNo: 'asc' },
  });

  let totalRuns = 0;
  let totalWickets = 0;
  let totalExtras = 0;
  let legalBalls = 0;

  for (const ball of balls) {
    totalRuns += ball.runsScored + ball.extras;
    totalExtras += ball.extras;
    if (ball.wicketType) totalWickets++;
    if (isLegalDelivery(ball.ballType)) legalBalls++;
  }

  await db.innings.update({
    where: { id: inningsId },
    data: {
      totalRuns,
      totalWickets,
      totalExtras,
      legalBalls,
      oversBowled: toOversNotation(legalBalls),
      allOut: totalWickets >= maxWickets,
    },
  });
}

async function getSecondInningsTarget(db: DbClient, matchId: string): Promise<number> {
  const firstInnings = await db.innings.findFirst({
    where: { matchId, inningsNumber: 1 },
  });

  if (!firstInnings || firstInnings.status !== 'completed') {
    throw new ValidationError('First innings must be completed before starting the chase');
  }

  return firstInnings.totalRuns + 1;
}

function getChaseResult(
  innings: NonNullable<RecordBallTransactionResult['innings']>
): { winnerTeamId?: string; resultMargin: string } {
  const target = innings.targetRuns;
  if (!target) throw new ValidationError('Second innings target is missing');

  const defendingScore = target - 1;

  if (innings.totalRuns > defendingScore) {
    const maxWickets = innings.targetWickets || 10;
    return {
      winnerTeamId: innings.battingTeamId,
      resultMargin: `${maxWickets - innings.totalWickets} wickets`,
    };
  }

  if (innings.totalRuns === defendingScore) {
    return { resultMargin: 'Tie' };
  }

  return {
    winnerTeamId: innings.bowlingTeamId,
    resultMargin: `${defendingScore - innings.totalRuns} runs`,
  };
}

export class ScoringEngine {
  processBall(input: {
    runsOffBat: number;
    extraType: string;
    extraRuns: number;
  }): BallResult {
    const isLegal = isLegalDelivery(input.extraType);
    let extras = 0;

    if (input.extraType === 'wide' || input.extraType === 'no_ball') {
      extras = input.extraRuns + 1;
    } else if (input.extraType === 'bye' || input.extraType === 'leg_bye') {
      extras = input.extraRuns;
    }

    return {
      totalRuns: input.runsOffBat + extras,
      extras,
      isLegal,
    };
  }
}

const scoringEngine = new ScoringEngine();

// ─── Public API ────────────────────────────────────────────────────────────────

export async function createMatch(data: CreateMatchDto, userId: string, tenantId: string) {
  if (data.homeTeamId === data.awayTeamId) {
    throw new ValidationError('Home and away teams must be different');
  }

  if (data.tournamentId) {
    const tournamentTeams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: data.tournamentId },
      select: { teamId: true },
    });
    const teamIds = tournamentTeams.map((t) => t.teamId);

    if (!teamIds.includes(data.homeTeamId)) {
      throw new ValidationError('Home team is not part of this tournament');
    }
    if (!teamIds.includes(data.awayTeamId)) {
      throw new ValidationError('Away team is not part of this tournament');
    }
  }

  return prisma.match.create({
    data: {
      tenantId,
      matchDate: new Date(data.matchDate),
      scheduledStartTime: data.scheduledStartTime ? new Date(data.scheduledStartTime) : undefined,
      venue: data.venue,
      overs: data.overs,
      playersPerSide: data.playersPerSide,
      createdById: userId,
      scorerId: userId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      tournamentId: data.tournamentId,
    },
  });
}

export async function updateMatch(id: string, data: UpdateMatchDto, tenantId: string) {
  const match = await prisma.match.findFirst({
    where: { id, tenantId },
  });
  if (!match) throw new NotFoundError('Match not found');

  return prisma.match.update({
    where: { id },
    data: {
      venue: data.venue,
      overs: data.overs,
    },
  });
}

export async function getMatchById(id: string, tenantId?: string) {
  const where: any = { id };
  if (tenantId) where.tenantId = tenantId;

  const match = await prisma.match.findFirst({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      innings: {
        include: {
          battingTeam: true,
          bowlingTeam: true,
          balls: {
            orderBy: { sequenceNo: 'asc' },
          },
        },
      },
    },
  });
  if (!match) throw new NotFoundError('Match not found');
  return match;
}

export async function getAllMatches(tenantId?: string) {
  const where: any = {};
  if (tenantId) where.tenantId = tenantId;

  return prisma.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      winnerTeam: true,
      innings: {
        select: {
          inningsNumber: true,
          totalRuns: true,
          totalWickets: true,
          oversBowled: true,
          battingTeamId: true,
          status: true,
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
    orderBy: { matchDate: 'desc' },
  });
}

export async function recordToss(data: TossDto, tenantId: string) {
  const match = await prisma.match.findFirst({ where: { id: data.matchId, tenantId } });
  if (!match) throw new NotFoundError('Match not found');
  if (match.matchStatus !== 'scheduled') {
    throw new ValidationError('Toss already recorded');
  }

  return prisma.match.update({
    where: { id: data.matchId },
    data: { tossWinnerId: data.tossWinnerId, tossDecision: data.decision },
  });
}

export async function startInnings(data: StartInningsDto, tenantId: string) {
  const match = await prisma.match.findFirst({ where: { id: data.matchId, tenantId } });
  if (!match) throw new NotFoundError('Match not found');

  const existing = await prisma.innings.findFirst({
    where: { matchId: data.matchId, inningsNumber: data.inningsNumber },
  });
  if (existing) throw new ConflictError('Innings already started');

  const innings = await prisma.$transaction(async (tx) => {
    const inningsData: Prisma.InningsUncheckedCreateInput = {
      matchId: data.matchId,
      inningsNumber: data.inningsNumber,
      battingTeamId: data.battingTeamId,
      bowlingTeamId: data.bowlingTeamId,
      status: 'in_progress',
    };

    if (data.inningsNumber === 2) {
      inningsData.targetRuns = await getSecondInningsTarget(tx, data.matchId);
      inningsData.targetWickets = (match?.playersPerSide || 11) - 1;
    }

    const createdInnings = await tx.innings.create({ data: inningsData });

    const status = data.inningsNumber === 1 ? 'in_progress' : 'second_innings';
    const inningsIdField = data.inningsNumber === 1 ? 'firstInningsId' : 'secondInningsId';

    await tx.match.update({
      where: { id: data.matchId },
      data: { matchStatus: status, [inningsIdField]: createdInnings.id },
    });

    return createdInnings;
  });

  return innings;
}

export async function recordBall(data: BallInputDto, tenantId: string) {
  const result = await prisma.$transaction<RecordBallTransactionResult>(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: data.matchId } });
    if (!match) throw new NotFoundError('Match not found');
    if (match.tenantId !== tenantId) throw new ForbiddenError('Access denied');

    if (match.matchStatus !== 'in_progress' && match.matchStatus !== 'second_innings') {
      throw new ValidationError('Match is not in progress');
    }

    if (data.expectedVersion !== undefined && match.version !== data.expectedVersion) {
      throw new ConflictError('Match state changed. Please refresh and retry.');
    }

    if (data.requestId) {
      const existingBall = await tx.ball.findUnique({ where: { requestId: data.requestId } });
      if (existingBall) {
        const currentInnings = await tx.innings.findUnique({ where: { id: data.inningsId } });
        const currentMatch = await tx.match.findUnique({ where: { id: data.matchId } });
        const previousLegalBalls = await tx.ball.count({
          where: {
            inningsId: data.inningsId,
            ballType: { notIn: ['wide', 'no_ball'] },
          },
        });

        return {
          ball: existingBall,
          innings: currentInnings,
          match: currentMatch,
          overNumber: Math.floor(Math.max(previousLegalBalls - 1, 0) / 6) + 1,
          emitOverEnd: false,
        };
      }
    }

    const innings = await tx.innings.findUnique({ where: { id: data.inningsId } });
    if (!innings) throw new NotFoundError('Innings not found');
    if (innings.matchId !== data.matchId) {
      throw new ValidationError('Innings does not belong to this match');
    }
    if (innings.status !== 'in_progress') {
      throw new ValidationError('Innings is not in progress');
    }

    const maxWickets = (match?.playersPerSide || 11) - 1;
    if (innings.totalWickets >= maxWickets) throw new ConflictError('All wickets already fell');
    if (innings.targetRuns && innings.totalRuns >= innings.targetRuns) {
      throw new ConflictError('Target already reached');
    }

    const resultForBall = scoringEngine.processBall({
      runsOffBat: data.runsOffBat,
      extraType: data.extraType,
      extraRuns: data.extraRuns,
    });

    const lastBall = await tx.ball.findFirst({
      where: { inningsId: data.inningsId },
      orderBy: { sequenceNo: 'desc' },
    });
    const sequenceNo = lastBall ? lastBall.sequenceNo + 1 : 1;

    const previousLegalBalls = await tx.ball.count({
      where: {
        inningsId: data.inningsId,
        ballType: { notIn: ['wide', 'no_ball'] },
      },
    });
    const overNumber = Math.floor(previousLegalBalls / 6) + 1;
    const ballNumber = (previousLegalBalls % 6) + 1;
    const emitOverEnd = resultForBall.isLegal && ballNumber === 6;

    const totalRunsOnBall = data.runsOffBat + resultForBall.extras;
    const isStrikeRotation = !data.isWicket && totalRunsOnBall % 2 === 1;

    const ball = await tx.ball.create({
      data: {
        inningsId: data.inningsId,
        overNumber,
        ballNumber,
        sequenceNo,
        batsmanPlayerId: data.batsmanPlayerId,
        nonStrikerPlayerId: data.nonStrikerPlayerId,
        bowlerPlayerId: data.bowlerPlayerId,
        ballType: data.extraType,
        runsScored: data.runsOffBat,
        extras: resultForBall.extras,
        wicketType: data.isWicket ? data.wicketType : undefined,
        wicketPlayerId: data.isWicket ? data.batsmanPlayerId : undefined,
        fielderPlayerId: data.fielderPlayerId,
        isStrikeRotation,
        overComplete: emitOverEnd ? 'yes' : 'not_applicable',
        requestId: data.requestId || null,
      },
    });

    await recomputeInnings(tx, data.inningsId, (match?.playersPerSide || 11) - 1);

    let updatedInnings = await tx.innings.findUnique({ where: { id: data.inningsId } });
    if (!updatedInnings) throw new NotFoundError('Innings not found');

    const allOut = updatedInnings.totalWickets >= maxWickets;
    const targetReached = updatedInnings.targetRuns !== null && updatedInnings.totalRuns >= updatedInnings.targetRuns;
    const oversComplete = updatedInnings.legalBalls >= match.overs * 6;

    const matchUpdate: Prisma.MatchUncheckedUpdateInput = { version: { increment: 1 } };
    let inningsEndReason: InningsEndReason | undefined;

    if (innings.inningsNumber === 1 && (allOut || oversComplete)) {
      updatedInnings = await tx.innings.update({
        where: { id: data.inningsId },
        data: { status: 'completed', targetRuns: updatedInnings.totalRuns + 1, allOut },
      });
      matchUpdate.matchStatus = 'tea_break';
      inningsEndReason = allOut ? 'all_out' : 'overs_complete';
    } else if (innings.inningsNumber === 2 && targetReached) {
      const chaseResult = getChaseResult(updatedInnings);
      updatedInnings = await tx.innings.update({
        where: { id: data.inningsId },
        data: { status: 'completed', allOut },
      });
      matchUpdate.matchStatus = 'completed';
      matchUpdate.winnerTeamId = chaseResult.winnerTeamId;
      matchUpdate.resultMargin = chaseResult.resultMargin;
      inningsEndReason = 'target_reached';
    } else if (innings.inningsNumber === 2 && (allOut || oversComplete)) {
      const chaseResult = getChaseResult(updatedInnings);
      updatedInnings = await tx.innings.update({
        where: { id: data.inningsId },
        data: { status: 'completed', allOut },
      });
      matchUpdate.matchStatus = 'completed';
      matchUpdate.winnerTeamId = chaseResult.winnerTeamId;
      matchUpdate.resultMargin = chaseResult.resultMargin;
      inningsEndReason = allOut ? 'all_out' : 'overs_complete';
    }

    await tx.match.update({ where: { id: data.matchId }, data: matchUpdate });

    const finalMatch = await tx.match.findUnique({ where: { id: data.matchId } });
    const finalInnings = await tx.innings.findUnique({ where: { id: data.inningsId } });

    return { ball, innings: finalInnings, match: finalMatch, overNumber, emitOverEnd, inningsEndReason };
  });

  if (result.inningsEndReason && result.innings && result.match) {
    emitInningsEnd(data.matchId, { innings: result.innings, match: result.match, reason: result.inningsEndReason });
  }
  if (result.emitOverEnd && result.innings) {
    emitOverComplete(data.matchId, { overNumber: result.overNumber, innings: result.innings });
  }
  emitBallAdded(data.matchId, { ball: result.ball, innings: result.innings, match: result.match });

  return result.ball;
}

export async function undoLastBall(matchId: string, tenantId: string) {
  const result = await prisma.$transaction(async (tx) => {
    await assertMatchTenant(tx, matchId, tenantId);

    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundError('Match not found');

    const innings = await tx.innings.findFirst({
      where: { match: { id: matchId }, status: 'in_progress' },
      orderBy: { inningsNumber: 'desc' },
    });
    if (!innings) throw new ValidationError('No innings in progress');

    const lastBall = await tx.ball.findFirst({
      where: { inningsId: innings.id },
      orderBy: { sequenceNo: 'desc' },
    });
    if (!lastBall) throw new ValidationError('No balls to undo');

    await tx.ball.delete({ where: { id: lastBall.id } });
    await recomputeInnings(tx, innings.id, (match?.playersPerSide || 11) - 1);

    const updatedInnings = await tx.innings.findUnique({ where: { id: innings.id } });
    await tx.match.update({
      where: { id: matchId },
      data: {
        version: { increment: 1 },
        matchStatus: match.matchStatus === 'completed' ? 'in_progress' : undefined,
      },
    });

    const updatedMatch = await tx.match.findUnique({ where: { id: matchId } });
    return { lastBall, innings: updatedInnings, match: updatedMatch };
  });

  emitBallRemoved(matchId, { innings: result.innings, match: result.match });
  return result.lastBall;
}

export async function declareInnings(data: DeclareInningsDto, tenantId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const innings = await tx.innings.findUnique({ where: { id: data.inningsId } });
    if (!innings) throw new NotFoundError('Innings not found');

    await assertMatchTenant(tx, innings.matchId, tenantId);

    const match = await tx.match.findUnique({ where: { id: innings.matchId } });
    if (!match) throw new NotFoundError('Match not found');

    let updatedInnings = await tx.innings.update({
      where: { id: data.inningsId },
      data: { status: 'completed' },
    });

    if (innings.inningsNumber === 1) {
      updatedInnings = await tx.innings.update({
        where: { id: data.inningsId },
        data: { targetRuns: innings.totalRuns + 1 },
      });
      await tx.match.update({ where: { id: match.id }, data: { matchStatus: 'tea_break' } });
    } else {
      const chaseResult = getChaseResult(updatedInnings);
      await tx.match.update({
        where: { id: match.id },
        data: {
          matchStatus: 'completed',
          winnerTeamId: chaseResult.winnerTeamId,
          resultMargin: chaseResult.resultMargin,
        },
      });
    }

    const updatedMatch = await tx.match.findUnique({ where: { id: match.id } });
    return { innings: updatedInnings, match: updatedMatch, reason: 'declared' as const };
  });

  if (result.match) {
    emitInningsEnd(result.innings.matchId, {
      innings: result.innings,
      match: result.match,
      reason: result.reason,
    });
  }

  return result.innings;
}

export async function getMatchScoreboard(matchId: string, tenantId?: string) {
  const where: any = { id: matchId };
  if (tenantId) where.tenantId = tenantId;

  const match = await prisma.match.findFirst({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      winnerTeam: true,
      innings: {
        include: {
          battingTeam: true,
          bowlingTeam: true,
          balls: {
            orderBy: { sequenceNo: 'desc' },
            take: 12,
          },
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });
  if (!match) throw new NotFoundError('Match not found');

  let result: string | undefined;
  if (match.matchStatus === 'completed' && match.winnerTeamId) {
    const winner = match.winnerTeam || (match.homeTeamId === match.winnerTeamId ? match.homeTeam : match.awayTeam);
    result = `${winner?.name} won ${match.resultMargin ? `by ${match.resultMargin}` : ''}`;
  } else if (match.matchStatus === 'completed' && match.resultMargin === 'Tie') {
    result = 'Match tied';
  }

  return {
    id: match.id,
    matchDate: match.matchDate,
    venue: match.venue,
    overs: match.overs,
    matchStatus: match.matchStatus,
    result,
    resultMargin: match.resultMargin,
    winnerTeamId: match.winnerTeamId,
    tossWinnerId: match.tossWinnerId,
    tossDecision: match.tossDecision,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    innings: match.innings,
  };
}

export async function getInningsScoreboard(matchId: string, inningsNumber: number, tenantId?: string) {
  const where: any = { id: matchId };
  if (tenantId) where.tenantId = tenantId;

  const match = await prisma.match.findFirst({ where });
  if (!match) throw new NotFoundError('Match not found');

  const innings = await prisma.innings.findFirst({
    where: { matchId, inningsNumber },
    include: { battingTeam: true, bowlingTeam: true },
  });
  if (!innings) throw new NotFoundError('Innings not found');

  const balls = await prisma.ball.findMany({
    where: { inningsId: innings.id },
    orderBy: { sequenceNo: 'asc' },
    include: {
      batsman: { select: { id: true, fullName: true } },
      nonStriker: { select: { id: true, fullName: true } },
      bowler: { select: { id: true, fullName: true } },
      wicketPlayer: { select: { id: true, fullName: true } },
      fielder: { select: { id: true, fullName: true } },
    },
  });

  return {
    inningsNumber: innings.inningsNumber,
    battingTeam: innings.battingTeam,
    bowlingTeam: innings.bowlingTeam,
    status: innings.status,
    runs: innings.totalRuns,
    wickets: innings.totalWickets,
    overs: innings.oversBowled.toFixed(1),
    runRate: getRunRate(innings.totalRuns, innings.legalBalls),
    totalExtras: innings.totalExtras,
    legalBalls: innings.legalBalls,
    target: innings.targetRuns,
    allOut: innings.allOut,
    balls,
  };
}

export async function getOverDetails(matchId: string, overNumber: number, tenantId?: string) {
  const where: any = { id: matchId };
  if (tenantId) where.tenantId = tenantId;

  const match = await prisma.match.findFirst({ where });
  if (!match) throw new NotFoundError('Match not found');

  const activeInnings = await prisma.innings.findFirst({
    where: { matchId, status: 'in_progress' },
    orderBy: { inningsNumber: 'desc' },
  });
  if (!activeInnings) throw new NotFoundError('No active innings');

  return prisma.ball.findMany({
    where: { inningsId: activeInnings.id, overNumber },
    orderBy: { ballNumber: 'asc' },
    include: {
      batsman: { select: { id: true, fullName: true } },
      bowler: { select: { id: true, fullName: true } },
    },
  });
}

export async function getMatchPerformance(matchId: string, tenantId?: string) {
  const where: any = { id: matchId };
  if (tenantId) where.tenantId = tenantId;

  const match = await prisma.match.findFirst({
    where,
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) throw new NotFoundError('Match not found');

  const allInnings = await prisma.innings.findMany({
    where: { matchId },
    orderBy: { inningsNumber: 'asc' },
    include: { battingTeam: true, bowlingTeam: true },
  });

  const performanceData = await Promise.all(
    allInnings.map(async (innings) => {
      const balls = await prisma.ball.findMany({
        where: { inningsId: innings.id },
        orderBy: { sequenceNo: 'asc' },
        include: {
          batsman: { select: { id: true, fullName: true } },
          nonStriker: { select: { id: true, fullName: true } },
          bowler: { select: { id: true, fullName: true } },
          wicketPlayer: { select: { id: true, fullName: true } },
          fielder: { select: { id: true, fullName: true } },
        },
      });

      // --- Batting Scorecard ---
      const battingMap = new Map<string, {
        playerId: string; playerName: string; runs: number; balls: number;
        fours: number; sixes: number; dotBalls: number; dismissed: boolean;
        wicketType?: string; fielderName?: string; bowlerName?: string; battingOrder: number;
      }>();

      let battingOrderCounter = 0;
      const seenBatsmen = new Set<string>();

      for (const ball of balls) {
        for (const pid of [ball.batsmanPlayerId, ball.nonStrikerPlayerId]) {
          const pName = pid === ball.batsmanPlayerId ? ball.batsman.fullName : ball.nonStriker.fullName;
          if (!seenBatsmen.has(pid)) {
            seenBatsmen.add(pid);
            battingOrderCounter++;
            battingMap.set(pid, {
              playerId: pid, playerName: pName, runs: 0, balls: 0,
              fours: 0, sixes: 0, dotBalls: 0, dismissed: false, battingOrder: battingOrderCounter,
            });
          }
        }

        const entry = battingMap.get(ball.batsmanPlayerId)!;
        entry.runs += ball.runsScored;
        if (ball.ballType !== 'wide') {
          entry.balls++;
          if (ball.runsScored === 0 && !ball.wicketType) entry.dotBalls++;
        }
        if (ball.runsScored === 4) entry.fours++;
        if (ball.runsScored === 6) entry.sixes++;

        if (ball.wicketType && ball.wicketPlayerId) {
          const dismissedEntry = battingMap.get(ball.wicketPlayerId);
          if (dismissedEntry) {
            dismissedEntry.dismissed = true;
            dismissedEntry.wicketType = ball.wicketType;
            dismissedEntry.bowlerName = ball.bowler.fullName;
            dismissedEntry.fielderName = ball.fielder?.fullName;
          }
        }
      }

      const battingScorecard = Array.from(battingMap.values())
        .sort((a, b) => a.battingOrder - b.battingOrder)
        .map((b) => ({
          ...b,
          strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0,
        }));

      // --- Bowling Scorecard ---
      const bowlingMap = new Map<string, {
        playerId: string; playerName: string; ballsFaced: number; runsConceded: number;
        wickets: number; maidens: number; noBalls: number; wides: number;
        currentOverRuns: number; currentOverBalls: number; lastOverNumber: number;
      }>();

      for (const ball of balls) {
        if (!bowlingMap.has(ball.bowlerPlayerId)) {
          bowlingMap.set(ball.bowlerPlayerId, {
            playerId: ball.bowlerPlayerId, playerName: ball.bowler.fullName,
            ballsFaced: 0, runsConceded: 0, wickets: 0, maidens: 0,
            noBalls: 0, wides: 0, currentOverRuns: 0, currentOverBalls: 0,
            lastOverNumber: ball.overNumber,
          });
        }
        const bowlerEntry = bowlingMap.get(ball.bowlerPlayerId)!;
        const totalBallRuns = ball.runsScored + ball.extras;
        bowlerEntry.runsConceded += totalBallRuns;
        if (ball.ballType === 'no_ball') bowlerEntry.noBalls++;
        if (ball.ballType === 'wide') bowlerEntry.wides++;

        const isLegal = ball.ballType !== 'wide' && ball.ballType !== 'no_ball';
        if (isLegal) {
          bowlerEntry.ballsFaced++;
          if (bowlerEntry.lastOverNumber !== ball.overNumber) {
            if (bowlerEntry.currentOverRuns === 0 && bowlerEntry.currentOverBalls === 6) {
              bowlerEntry.maidens++;
            }
            bowlerEntry.currentOverRuns = 0;
            bowlerEntry.currentOverBalls = 0;
          }
          bowlerEntry.currentOverRuns += totalBallRuns;
          bowlerEntry.currentOverBalls++;
          bowlerEntry.lastOverNumber = ball.overNumber;
        }
        if (ball.wicketType && ball.wicketType !== 'run_out') bowlerEntry.wickets++;
      }

      const bowlingScorecard = Array.from(bowlingMap.values()).map((b) => ({
        playerId: b.playerId,
        playerName: b.playerName,
        oversDisplay: toOversNotation(b.ballsFaced),
        maidens: b.maidens,
        runsConceded: b.runsConceded,
        wickets: b.wickets,
        noBalls: b.noBalls,
        wides: b.wides,
        economy: b.ballsFaced > 0 ? parseFloat(((b.runsConceded / b.ballsFaced) * 6).toFixed(2)) : 0,
      }));

      return {
        inningsNumber: innings.inningsNumber,
        battingTeam: innings.battingTeam,
        bowlingTeam: innings.bowlingTeam,
        totalRuns: innings.totalRuns,
        totalWickets: innings.totalWickets,
        oversBowled: innings.oversBowled,
        battingScorecard,
        bowlingScorecard,
      };
    })
  );

  return {
    matchId: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    performances: performanceData,
  };
}
