import { tournamentRepository } from '../repositories';
import { CreateTournamentDto, UpdateTournamentDto } from '../dto';
import { Tournament, TournamentType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../middlewares/error_handler';

export class TournamentService {
  async createTournament(data: CreateTournamentDto, userId: string): Promise<Tournament> {
    return tournamentRepository.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: userId,
      type: data.type as TournamentType,
    });
  }

  async getTournament(id: string) {
    const tournament = await tournamentRepository.findById(id);
    if (!tournament) {

      throw new NotFoundError('Tournament not found');
    }
    return tournament;
  }

  async getAllTournaments() {
    return tournamentRepository.findAll();
  }

  async updateTournament(id: string, data: UpdateTournamentDto) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return tournamentRepository.update(id, updateData);
  }

  async deleteTournament(id: string) {
    return tournamentRepository.delete(id);
  }

  async addTeamsToTournament(id: string, teamIds: string[]) {
    return tournamentRepository.addTeams(id, teamIds);
  }

  async removeTeamFromTournament(tournamentId: string, teamId: string) {
    return tournamentRepository.removeTeam(tournamentId, teamId);
  }

  async getPointsTable(tournamentId: string) {
    const tournament = await tournamentRepository.findById(tournamentId);
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
          // If match is completed but no winner, it's a draw/tie
          drawn++;
        } else {
          lost++;
        }
      });

      // Also account for abandoned matches in noResult
      const abandonedMatches = matches.filter(
        (m) => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.matchStatus === 'abandoned'
      );
      noResult = abandonedMatches.length;
      played += noResult;

      const points = (won * pointsPerWin) + (drawn * pointsPerDraw) + (noResult * pointsPerNoResult);

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

    // Sort by points (primary) and then wins (secondary)
    return pointsTable.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.won - a.won;
    });
  }
}

export const tournamentService = new TournamentService();
