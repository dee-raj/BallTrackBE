import prisma from '../../../database';
import { Match, Innings, Ball, MatchStatus, InningsStatus, BallType, OverSetComplete } from '@prisma/client';

export class MatchesRepository {
  async findById(id: string): Promise<Match | null> {
    return prisma.match.findUnique({
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
  }

  async findAll(): Promise<Match[]> {
    return prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { matchDate: 'desc' },
    });
  }

  async findByStatus(status: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: { matchStatus: status as MatchStatus },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  async create(data: {
    matchDate: Date;
    scheduledStartTime?: Date;
    venue?: string;
    overs: number;
    createdById: string;
    scorerId: string;
    homeTeamId: string;
    awayTeamId: string;
    tenantId: string;
  }): Promise<Match> {
    const {
      tenantId,
      createdById,
      scorerId,
      homeTeamId,
      awayTeamId,
      ...rest
    } = data;
    return prisma.match.create({
      data: {
        ...rest,
        tenant: { connect: { id: tenantId } },
        createdBy: { connect: { id: createdById } },
        scorer: { connect: { id: scorerId } },
        homeTeam: { connect: { id: homeTeamId } },
        awayTeam: { connect: { id: awayTeamId } },
      },
    });
  }

  async update(
    id: string,
    data: {
      matchStatus?: MatchStatus;
      tossWinnerId?: string;
      tossDecision?: string;
      firstInningsId?: string;
      secondInningsId?: string;
      winnerTeamId?: string;
      resultMargin?: string;
    }
  ): Promise<Match> {
    return prisma.match.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string): Promise<Match> {
    return prisma.match.delete({
      where: { id },
    });
  }
}

export class InningsRepository {
  async findById(id: string): Promise<Innings | null> {
    return prisma.innings.findUnique({
      where: { id },
      include: {
        battingTeam: true,
        bowlingTeam: true,
        balls: {
          orderBy: { sequenceNo: 'asc' },
        },
      },
    });
  }

  async create(data: {
    matchId: string;
    inningsNumber: number;
    battingTeamId: string;
    bowlingTeamId: string;
  }): Promise<Innings> {
    const { matchId, battingTeamId, bowlingTeamId, ...rest } = data;
    return prisma.innings.create({
      data: {
        ...rest,
        status: 'in_progress',
        match: { connect: { id: matchId } },
        battingTeam: { connect: { id: battingTeamId } },
        bowlingTeam: { connect: { id: bowlingTeamId } },
      },
    });
  }

  async update(
    id: string,
    data: {
      status?: InningsStatus;
      totalRuns?: number;
      totalWickets?: number;
      totalExtras?: number;
      oversBowled?: number;
      maidensBowled?: number;
      targetRuns?: number;
      targetWickets?: number;
    }
  ): Promise<Innings> {
    return prisma.innings.update({
      where: { id },
      data: data as any,
    });
  }
}

export class BallsRepository {
  async findByInnings(inningsId: string): Promise<Ball[]> {
    return prisma.ball.findMany({
      where: { inningsId },
      orderBy: { sequenceNo: 'asc' },
    });
  }

  async findLastBall(inningsId: string): Promise<Ball | null> {
    return prisma.ball.findFirst({
      where: { inningsId },
      orderBy: { sequenceNo: 'desc' },
    });
  }

  async create(data: {
    inningsId: string;
    overNumber: number;
    ballNumber: number;
    sequenceNo: number;
    batsmanPlayerId: string;
    nonStrikerPlayerId: string;
    bowlerPlayerId: string;
    ballType: BallType;
    runsScored: number;
    extras: number;
    wicketType?: string;
    wicketPlayerId?: string;
    fielderPlayerId?: string;
    isStrikeRotation: boolean;
    overComplete: OverSetComplete;
  }): Promise<Ball> {
    const {
      inningsId,
      batsmanPlayerId,
      nonStrikerPlayerId,
      bowlerPlayerId,
      wicketPlayerId,
      fielderPlayerId,
      ...rest
    } = data;

    const connectData: any = {
      ...rest,
      innings: { connect: { id: inningsId } },
      batsman: { connect: { id: batsmanPlayerId } },
      nonStriker: { connect: { id: nonStrikerPlayerId } },
      bowler: { connect: { id: bowlerPlayerId } },
    };

    if (wicketPlayerId) {
      connectData.wicketPlayer = { connect: { id: wicketPlayerId } };
    }
    if (fielderPlayerId) {
      connectData.fielder = { connect: { id: fielderPlayerId } };
    }

    return prisma.ball.create({
      data: connectData,
    });
  }
}

export const matchesRepository = new MatchesRepository();
export const inningsRepository = new InningsRepository();
export const ballsRepository = new BallsRepository();