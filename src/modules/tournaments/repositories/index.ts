import prisma from '../../../database';
import { Tournament, TournamentTeam, TournamentType } from '@prisma/client';

export class TournamentRepository {
  async findById(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            winnerTeam: true,
            innings: true,

          },
        },
      },
    });
  }

  async findAll() {
    return prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    type: TournamentType;
    pointsPerWin: number;
    pointsPerLoss: number;
    pointsPerDraw: number;
    pointsPerNoResult: number;
    createdById: string;
  }): Promise<Tournament> {
    return prisma.tournament.create({
      data,
    });
  }

  async update(id: string, data: Partial<Tournament>): Promise<Tournament> {
    return prisma.tournament.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Tournament> {
    return prisma.tournament.delete({
      where: { id },
    });
  }

  async addTeams(tournamentId: string, teamIds: string[]): Promise<void> {
    await prisma.tournamentTeam.createMany({
      data: teamIds.map((teamId) => ({
        tournamentId,
        teamId,
      })),
      skipDuplicates: true,
    });
  }

  async removeTeam(tournamentId: string, teamId: string): Promise<void> {
    await prisma.tournamentTeam.deleteMany({
      where: {
        tournamentId,
        teamId,
      },
    });
  }

  async getTournamentTeams(tournamentId: string) {
    return prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: {
        team: true,
      },
    });
  }
}

export const tournamentRepository = new TournamentRepository();
