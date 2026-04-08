import { NotFoundError, ConflictError, ValidationError } from '../../../middlewares/error_handler';
import prisma from '../../../database';
import type {
  CreateMatchDto,
  TossDto,
  BallInputDto,
  StartInningsDto,
  UpdateMatchStatusDto,
  DeclareInningsDto,
} from '../dto';

interface BallResult {
  totalRuns: number;
  extras: number;
  isLegal: boolean;
}

export class ScoringEngine {
  processBall(input: {
    runsOffBat: number;
    extraType: string;
    extraRuns: number;
    isWicket: boolean;
  }): BallResult {
    const isLegal = input.extraType === 'normal';
    let extras = 0;

    if (input.extraType === 'wide' || input.extraType === 'no_ball') {
      extras = input.extraRuns + 1;
    } else if (input.extraType === 'bye' || input.extraType === 'leg_bye') {
      extras = input.extraRuns;
    }

    const totalRuns = input.runsOffBat + extras;

    return { totalRuns, extras, isLegal };
  }

  async recompute(inningsId: string): Promise<void> {
    const balls = await prisma.ball.findMany({
      where: { inningsId },
      orderBy: { sequenceNo: 'asc' },
    });

    let totalRuns = 0;
    let totalWickets = 0;
    let totalExtras = 0;
    let legalBalls = 0;

    for (const ball of balls) {
      const result = this.processBall({
        runsOffBat: ball.runsScored,
        extraType: ball.ballType,
        extraRuns: ball.extras > 0 ? ball.extras - (ball.wicketType ? 0 : 0) : 0,
        isWicket: !!ball.wicketType,
      });

      totalRuns += result.totalRuns;
      totalExtras += result.extras;

      if (ball.wicketType) {
        totalWickets++;
      }

      if (result.isLegal) {
        legalBalls++;
      }
    }

    const oversBowled = legalBalls / 6;

    await prisma.innings.update({
      where: { id: inningsId },
      data: {
        totalRuns,
        totalWickets,
        totalExtras,
        legalBalls,
        oversBowled,
        allOut: totalWickets >= 10,
      },
    });
  }

  async checkAllOut(inningsId: string): Promise<boolean> {
    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
    });

    if (innings && innings.totalWickets >= 10) {
      await prisma.innings.update({
        where: { id: inningsId },
        data: { allOut: true },
      });
      return true;
    }
    return false;
  }

  async checkOversComplete(inningsId: string, matchOvers: number): Promise<boolean> {
    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
    });

    if (innings && innings.oversBowled >= matchOvers) {
      return true;
    }
    return false;
  }

  async checkTargetReached(inningsId: string): Promise<{ reached: boolean; margin?: string }> {
    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
      include: { match: true },
    });

    if (!innings || !innings.targetRuns) {
      return { reached: false };
    }

    if (innings.totalRuns >= innings.targetRuns) {
      const runsMargin = innings.totalRuns - innings.targetRuns + 1;
      return { reached: true, margin: `${runsMargin} wickets` };
    }

    if (innings.targetWickets && innings.totalWickets >= innings.targetWickets) {
      return { reached: true, margin: `${innings.targetWickets - innings.totalWickets} runs` };
    }

    return { reached: false };
  }
}

const scoringEngine = new ScoringEngine();

export async function createMatch(data: CreateMatchDto, userId: string) {
  if (data.homeTeamId === data.awayTeamId) {
    throw new ValidationError('Home and away teams must be different');
  }

  return prisma.match.create({
    data: {
      matchDate: new Date(data.matchDate),
      scheduledStartTime: data.scheduledStartTime ? new Date(data.scheduledStartTime) : undefined,
      venue: data.venue,
      overs: data.overs,
      createdById: userId,
      scorerId: userId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
    },
  });
}

export async function getMatchById(id: string) {
  const match = await prisma.match.findUnique({
    where: { id },
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

export async function getAllMatches() {
  return prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: 'desc' },
  });
}

export async function recordToss(data: TossDto) {
  const match = await prisma.match.findUnique({ where: { id: data.matchId } });
  if (!match) throw new NotFoundError('Match not found');
  if (match.matchStatus !== 'scheduled') {
    throw new ValidationError('Toss already recorded');
  }

  return prisma.match.update({
    where: { id: data.matchId },
    data: { tossWinnerId: data.tossWinnerId, tossDecision: data.decision },
  });
}

export async function startInnings(data: StartInningsDto) {
  const match = await prisma.match.findUnique({ where: { id: data.matchId } });
  if (!match) throw new NotFoundError('Match not found');

  const existing = await prisma.innings.findFirst({
    where: { matchId: data.matchId, inningsNumber: data.inningsNumber },
  });
  if (existing) throw new ConflictError('Innings already started');

  const innings = await prisma.innings.create({
    data: {
      matchId: data.matchId,
      inningsNumber: data.inningsNumber,
      battingTeamId: data.battingTeamId,
      bowlingTeamId: data.bowlingTeamId,
      status: 'in_progress',
    },
  });

  const status = data.inningsNumber === 1 ? 'in_progress' : 'second_innings';
  const inningsIdField = data.inningsNumber === 1 ? 'firstInningsId' : 'secondInningsId';

  await prisma.match.update({
    where: { id: data.matchId },
    data: { matchStatus: status, [inningsIdField]: innings.id },
  });

  return innings;
}

export async function recordBall(data: BallInputDto) {
  return prisma.$transaction(async (tx) => {
    const innings = await tx.innings.findUnique({ where: { id: data.inningsId } });
    if (!innings) throw new NotFoundError('Innings not found');
    if (innings.status !== 'in_progress') {
      throw new ValidationError('Innings is not in progress');
    }

    const match = await tx.match.findUnique({ where: { id: data.matchId } });
    if (!match || (match.matchStatus !== 'in_progress' && match.matchStatus !== 'second_innings')) {
      throw new ValidationError('Match is not in progress');
    }

    const lastBall = await tx.ball.findFirst({
      where: { inningsId: data.inningsId },
      orderBy: { sequenceNo: 'desc' },
    });
    const sequenceNo = lastBall ? lastBall.sequenceNo + 1 : 1;

    const overNumber = Math.floor((sequenceNo - 1) / 6) + 1;
    const ballInOver = ((sequenceNo - 1) % 6) + 1;

    const result = scoringEngine.processBall({
      runsOffBat: data.runsOffBat,
      extraType: data.extraType,
      extraRuns: data.extraRuns,
      isWicket: data.isWicket,
    });

    let isStrikeRotation = false;
    if (!data.isWicket && data.runsOffBat % 2 === 1) {
      isStrikeRotation = true;
    }

    const ball = await tx.ball.create({
      data: {
        inningsId: data.inningsId,
        overNumber,
        ballNumber: ballInOver,
        sequenceNo,
        batsmanPlayerId: data.batsmanPlayerId,
        nonStrikerPlayerId: data.nonStrikerPlayerId,
        bowlerPlayerId: data.bowlerPlayerId,
        ballType: data.extraType as any,
        runsScored: data.runsOffBat,
        extras: result.extras,
        wicketType: data.isWicket ? (data.wicketType as any) : undefined,
        wicketPlayerId: data.isWicket ? data.batsmanPlayerId : undefined,
        fielderPlayerId: data.fielderPlayerId,
        isStrikeRotation,
        overComplete: ballInOver === 6 ? 'yes' : 'not_applicable' as any,
      },
    });

    await scoringEngine.recompute(data.inningsId);

    const allOut = await scoringEngine.checkAllOut(data.inningsId);

    const matchUpdate: any = {};
    if (allOut && innings.inningsNumber === 1) {
      const targetRuns = innings.totalRuns + 1;
      await tx.innings.update({
        where: { id: data.inningsId },
        data: { targetRuns, status: 'completed', allOut: true },
      });
      matchUpdate.matchStatus = 'tea_break';
    } else if (allOut && innings.inningsNumber === 2) {
      await tx.innings.update({
        where: { id: data.inningsId },
        data: { status: 'completed', allOut: true },
      });
      matchUpdate.matchStatus = 'completed';
    }

    if (Object.keys(matchUpdate).length > 0) {
      await tx.match.update({ where: { id: data.matchId }, data: matchUpdate });
    }

    return ball;
  });
}

export async function undoLastBall(matchId: string) {
  return prisma.$transaction(async (tx) => {
    const innings = await tx.innings.findFirst({
      where: { match: { id: matchId }, status: 'in_progress' },
    });
    if (!innings) throw new ValidationError('No innings in progress');

    const lastBall = await tx.ball.findFirst({
      where: { inningsId: innings.id },
      orderBy: { sequenceNo: 'desc' },
    });
    if (!lastBall) throw new ValidationError('No balls to undo');

    await tx.ball.delete({ where: { id: lastBall.id } });

    await scoringEngine.recompute(innings.id);

    const updatedInnings = await tx.innings.findUnique({ where: { id: innings.id } });
    if (updatedInnings) {
      await tx.match.update({
        where: { id: matchId },
        data: { matchStatus: 'in_progress' },
      });
    }

    return lastBall;
  });
}

export async function declareInnings(data: DeclareInningsDto) {
  const innings = await prisma.innings.findUnique({ where: { id: data.inningsId } });
  if (!innings) throw new NotFoundError('Innings not found');

  const match = await prisma.match.findUnique({ where: { id: innings.matchId } });
  if (!match) throw new NotFoundError('Match not found');

  await prisma.$transaction(async (tx) => {
    await tx.innings.update({
      where: { id: data.inningsId },
      data: { status: 'completed' },
    });

    if (innings.inningsNumber === 1) {
      const targetRuns = innings.totalRuns + 1;
      await tx.innings.update({
        where: { id: data.inningsId },
        data: { targetRuns },
      });
      await tx.match.update({
        where: { id: match.id },
        data: { matchStatus: 'tea_break' },
      });
    } else {
      await tx.match.update({
        where: { id: match.id },
        data: { matchStatus: 'completed' },
      });
    }
  });

  return innings;
}

export async function getMatchScoreboard(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      innings: {
        include: { battingTeam: true, bowlingTeam: true },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });
  if (!match) throw new NotFoundError('Match not found');

  let result: string | undefined;
  if (match.matchStatus === 'completed' && match.winnerTeamId) {
    const winner = match.homeTeamId === match.winnerTeamId ? match.homeTeam : match.awayTeam;
    result = `${winner?.name} won`;
  }

  return {
    id: match.id,
    matchDate: match.matchDate,
    venue: match.venue,
    overs: match.overs,
    matchStatus: match.matchStatus,
    result,
    winnerTeamId: match.winnerTeamId,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    innings: match.innings,
  };
}

export async function getInningsScoreboard(matchId: string, inningsNumber: number) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new NotFoundError('Match not found');

  const innings = await prisma.innings.findFirst({
    where: { matchId, inningsNumber },
    include: { battingTeam: true, bowlingTeam: true },
  });
  if (!innings) throw new NotFoundError('Innings not found');

  const balls = await prisma.ball.findMany({
    where: { inningsId: innings.id },
    orderBy: { sequenceNo: 'asc' },
  });

  const runRate = innings.oversBowled > 0
    ? (innings.totalRuns / innings.oversBowled).toFixed(2)
    : '0.00';

  return {
    inningsNumber: innings.inningsNumber,
    battingTeam: innings.battingTeam,
    bowlingTeam: innings.bowlingTeam,
    status: innings.status,
    runs: innings.totalRuns,
    wickets: innings.totalWickets,
    overs: innings.oversBowled.toFixed(1),
    runRate: parseFloat(runRate),
    totalExtras: innings.totalExtras,
    legalBalls: innings.legalBalls,
    target: innings.targetRuns,
    allOut: innings.allOut,
    balls: balls,
  };
}

export async function getOverDetails(matchId: string, overNumber: number) {
  const innings = await prisma.innings.findFirst({
    where: { match: { id: matchId } },
  });
  if (!innings) throw new NotFoundError('Innings not found');

  const balls = await prisma.ball.findMany({
    where: { inningsId: innings.id, overNumber },
    orderBy: { ballNumber: 'asc' },
    include: {
      batsman: true,
      bowler: true,
    },
  });

  if (balls.length === 0) throw new NotFoundError('Over not found');

  const runs = balls.reduce((sum, b) => sum + b.runsScored + b.extras, 0);
  const wickets = balls.filter(b => b.wicketType).length;

  return { overNumber, runs, wickets, balls };
}