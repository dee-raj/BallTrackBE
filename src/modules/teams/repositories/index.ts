import prisma from '../../../database';
import { Team } from '@prisma/client';

export class TeamsRepository {
  async findById(id: string, tenantId?: string): Promise<Team | null> {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    return prisma.team.findFirst({
      where,
      include: { teamPlayers: { include: { player: true } } },
    });
  }

  async findAll(tenantId?: string): Promise<Team[]> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    return prisma.team.findMany({
      where,
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
    const { tenantId, createdById, ...rest } = data;
    return prisma.team.create({
      data: {
        ...rest,
        tenant: { connect: { id: tenantId } },
        createdBy: { connect: { id: createdById } },
      },
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