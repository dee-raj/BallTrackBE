import { teamsRepository } from '../repositories';
import { ConflictError, NotFoundError } from '../../../middlewares/error_handler';
import type { CreateTeamDto, UpdateTeamDto } from '../dto';

export class TeamsService {
  async getAll(tenantId?: string) {
    return teamsRepository.findAll(tenantId);
  }

  async getById(id: string, tenantId?: string) {
    const team = await teamsRepository.findById(id, tenantId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    return team;
  }

  async create(data: CreateTeamDto, createdById: string, tenantId: string) {
    const existing = await teamsRepository.findByName(data.name, tenantId);
    if (existing) {
      throw new ConflictError('Team name already exists');
    }

    return teamsRepository.create({
      name: data.name,
      shortName: data.shortName,
      homeGround: data.homeGround,
      logoUrl: data.logoUrl,
      createdById,
      tenantId,
    });
  }

  async update(id: string, data: UpdateTeamDto, tenantId: string) {
    const existingTeam = await teamsRepository.findById(id, tenantId);
    if (!existingTeam) {
      throw new NotFoundError('Team not found');
    }

    if (data.name && data.name !== existingTeam.name) {
      const nameTaken = await teamsRepository.findByName(data.name, tenantId);
      if (nameTaken) {
        throw new ConflictError('Team name already exists');
      }
    }

    return teamsRepository.update(id, {
      name: data.name,
      shortName: data.shortName,
      homeGround: data.homeGround,
      logoUrl: data.logoUrl,
    });
  }

  async delete(id: string, tenantId: string) {
    try {
      const existing = await teamsRepository.findById(id, tenantId);
      if (!existing) {
        throw new NotFoundError('Team not found');
      }
      return await teamsRepository.delete(id);
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ConflictError(
          'Cannot delete team. It is currently linked to matches or has registered players. Delete associated data first.'
        );
      }
      throw error;
    }
  }
}

export const teamsService = new TeamsService();