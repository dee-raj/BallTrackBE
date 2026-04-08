import { playersRepository, teamPlayersRepository } from '../repositories';
import { ConflictError, NotFoundError } from '../../../middlewares/error_handler';
import type { CreatePlayerDto, UpdatePlayerDto, AddPlayerToTeamDto, RemovePlayerFromTeamDto } from '../dto';
import { UserRole } from '../../../shared/constants';

export class PlayersService {
  async getAll() {
    return playersRepository.findAll();
  }

  async getById(id: string) {
    const player = await playersRepository.findById(id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }
    return player;
  }

  async create(data: CreatePlayerDto, _role: UserRole) {
    if (data.email) {
      const existing = await playersRepository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError('Email already registered');
      }
    }

    return playersRepository.create({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      photoUrl: data.photoUrl,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    });
  }

  async update(id: string, data: UpdatePlayerDto) {
    const existingPlayer = await playersRepository.findById(id);
    if (!existingPlayer) {
      throw new NotFoundError('Player not found');
    }

    if (data.email && data.email !== existingPlayer.email) {
      const emailTaken = await playersRepository.findByEmail(data.email);
      if (emailTaken) {
        throw new ConflictError('Email already registered');
      }
    }

    return playersRepository.update(id, {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      photoUrl: data.photoUrl,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    });
  }

  async delete(id: string) {
    const existing = await playersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Player not found');
    }
    return playersRepository.delete(id);
  }

  async addToTeam(teamId: string, data: AddPlayerToTeamDto) {
    const player = await playersRepository.findById(data.playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    const existing = await teamPlayersRepository.findByTeamAndPlayer(teamId, data.playerId);
    if (existing) {
      throw new ConflictError('Player already in team');
    }

    const jerseyTaken = await teamPlayersRepository.isJerseyNumberTaken(
      teamId,
      data.jerseyNumber
    );
    if (jerseyTaken) {
      throw new ConflictError('Jersey number already taken');
    }

    return teamPlayersRepository.create(teamId, data.playerId, data.jerseyNumber, data.isCaptain);
  }

  async removeFromTeam(data: RemovePlayerFromTeamDto) {
    const existing = await teamPlayersRepository.findByTeamAndPlayer(
      data.teamId,
      data.playerId
    );
    if (!existing) {
      throw new NotFoundError('Player not in team');
    }
    return teamPlayersRepository.delete(data.teamId, data.playerId);
  }

  async getTeamPlayers(teamId: string) {
    return teamPlayersRepository.findByTeam(teamId);
  }
}

export const playersService = new PlayersService();