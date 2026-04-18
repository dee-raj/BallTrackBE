import prisma from '../../../database';
import { Team } from '@prisma/client';

export class TeamsRepository {
  async findById(id: string, tenantId: string): Promise<Team | null> {
    return prisma.team.findFirst({
      where: { id, tenantId },
      include: { teamPlayers: { include: { player: true } } },
    });
  }

  async findAll(tenantId: string): Promise<Team[]> {
    return prisma.team.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: string, tenantId: string): Promise<Team | null> {
    return prisma.team.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, tenantId },
    });
  }

  async create(data: {
    name: string;
    shortName?: string;
    homeGround?: string;
    logoUrl?: string;
    createdById: string;
    tenantId: string;
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