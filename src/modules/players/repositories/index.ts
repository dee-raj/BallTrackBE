import prisma from '../../../database';
import { Player, TeamPlayer } from '@prisma/client';

export class PlayersRepository {
  async findById(id: string): Promise<Player | null> {
    return prisma.player.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Player[]> {
    return prisma.player.findMany({
      orderBy: { fullName: 'asc' },
    });
  }

  async findByEmail(email: string): Promise<Player | null> {
    return prisma.player.findUnique({
      where: { email },
    });
  }

  async create(data: {
    fullName: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    dateOfBirth?: Date;
  }): Promise<Player> {
    return prisma.player.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      fullName?: string;
      phone?: string | null;
      email?: string | null;
      photoUrl?: string | null;
      dateOfBirth?: Date | null;
    }
  ): Promise<Player> {
    return prisma.player.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Player> {
    return prisma.player.delete({
      where: { id },
    });
  }
}

export class TeamPlayersRepository {
  async findByTeamAndPlayer(
    teamId: string,
    playerId: string
  ): Promise<TeamPlayer | null> {
    return prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: { teamId, playerId },
      },
    });
  }

  async findByTeam(teamId: string): Promise<TeamPlayer[]> {
    return prisma.teamPlayer.findMany({
      where: { teamId },
      include: { player: true },
      orderBy: { jerseyNumber: 'asc' },
    });
  }

  async create(
    teamId: string,
    playerId: string,
    jerseyNumber: number,
    isCaptain?: boolean
  ): Promise<TeamPlayer> {
    return prisma.teamPlayer.create({
      data: {
        teamId,
        playerId,
        jerseyNumber,
        isCaptain: isCaptain ?? false,
      },
    });
  }

  async delete(teamId: string, playerId: string): Promise<TeamPlayer> {
    return prisma.teamPlayer.delete({
      where: {
        teamId_playerId: { teamId, playerId },
      },
    });
  }

  async isJerseyNumberTaken(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<boolean> {
    const existing = await prisma.teamPlayer.findFirst({
      where: {
        teamId,
        jerseyNumber,
        ...(excludePlayerId ? { playerId: { not: excludePlayerId } } : {}),
      },
    });
    return !!existing;
  }
}

export const playersRepository = new PlayersRepository();
export const teamPlayersRepository = new TeamPlayersRepository();