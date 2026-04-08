import prisma from '../../../database';
import { Team } from '@prisma/client';

export class TeamsRepository {
  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({
      where: { id },
      include: { teamPlayers: { include: { player: true } } },
    });
  }

  async findAll(): Promise<Team[]> {
    return prisma.team.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: string): Promise<Team | null> {
    return prisma.team.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  async create(data: {
    name: string;
    shortName?: string;
    homeGround?: string;
    logoUrl?: string;
    createdById: string;
  }): Promise<Team> {
    return prisma.team.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      shortName?: string | null;
      homeGround?: string | null;
      logoUrl?: string | null;
    }
  ): Promise<Team> {
    return prisma.team.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Team> {
    return prisma.team.delete({
      where: { id },
    });
  }
}

export const teamsRepository = new TeamsRepository();