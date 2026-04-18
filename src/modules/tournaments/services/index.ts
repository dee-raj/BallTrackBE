import { tournamentRepository } from '../repositories';
import { CreateTournamentDto, UpdateTournamentDto } from '../dto';
import { Tournament, TournamentType } from '@prisma/client';
import { NotFoundError } from '../../../middlewares/error_handler';

export class TournamentService {
  async createTournament(data: CreateTournamentDto, userId: string, tenantId: string): Promise<Tournament> {
    return tournamentRepository.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: userId,
      tenantId,
      type: data.type as TournamentType,
    });
  }

  async getTournament(id: string, tenantId: string) {
    const tournament = await tournamentRepository.findById(id, tenantId);
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    return tournament;
  }

  async getAllTournaments(tenantId: string) {
    return tournamentRepository.findAll(tenantId);
  }

  async updateTournament(id: string, data: UpdateTournamentDto, tenantId: string) {
    // Verify ownership before update
    const existing = await tournamentRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError('Tournament not found');
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return tournamentRepository.update(id, updateData);
  }

  async deleteTournament(id: string, tenantId: string) {
    const existing = await tournamentRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError('Tournament not found');
    }
    return tournamentRepository.delete(id);
  }

  async addTeamsToTournament(id: string, teamIds: string[], tenantId: string) {
    const existing = await tournamentRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError('Tournament not found');
    }
    return tournamentRepository.addTeams(id, teamIds);
  }

  async removeTeamFromTournament(tournamentId: string, teamId: string, tenantId: string) {
    const existing = await tournamentRepository.findById(tournamentId, tenantId);
    if (!existing) {
      throw new NotFoundError('Tournament not found');
    }
    return tournamentRepository.removeTeam(tournamentId, teamId);
  }

  async getPointsTable(tournamentId: string, tenantId: string) {
    const tournament = await tournamentRepository.findById(tournamentId, tenantId);
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }

    const { teams, matches, pointsPerWin, pointsPerDraw, pointsPerNoResult } = tournament;

    const pointsTable = teams.map((tt) => {
      const teamId = tt.teamId;
      const teamName = tt.team.name;

      const teamMatches = matches.filter(
        (m) => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.matchStatus === 'completed'
      );

      let played = teamMatches.length;
      let won = 0;
      let lost = 0;
      let drawn = 0;
      let noResult = 0;

      teamMatches.forEach((m) => {
        if (m.winnerTeamId === teamId) {
          won++;
        } else if (m.winnerTeamId === null) {
          drawn++;
        } else {
          lost++;
        }
      });

      const abandonedMatches = matches.filter(
        (m) => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.matchStatus === 'abandoned'
      );
      noResult = abandonedMatches.length;
      played += noResult;

      const points = won * pointsPerWin + drawn * pointsPerDraw + noResult * pointsPerNoResult;

      return {
        teamId,
        teamName,
        teamLogo: tt.team.logoUrl,
        played,
        won,
        lost,
        drawn,
        noResult,
        points,
      };
    });

    return pointsTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.won - a.won;
    });
  }
}

export const tournamentService = new TournamentService();
