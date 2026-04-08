import { teamsRepository } from '../repositories';
import { ConflictError, NotFoundError } from '../../../middlewares/error_handler';
import type { CreateTeamDto, UpdateTeamDto } from '../dto';

export class TeamsService {
  async getAll() {
    return teamsRepository.findAll();
  }

  async getById(id: string) {
    const team = await teamsRepository.findById(id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    return team;
  }

  async create(data: CreateTeamDto, createdById: string) {
    const existing = await teamsRepository.findByName(data.name);
    if (existing) {
      throw new ConflictError('Team name already exists');
    }

    return teamsRepository.create({
      name: data.name,
      shortName: data.shortName,
      homeGround: data.homeGround,
      logoUrl: data.logoUrl,
      createdById,
    });
  }

  async update(id: string, data: UpdateTeamDto) {
    const existingTeam = await teamsRepository.findById(id);
    if (!existingTeam) {
      throw new NotFoundError('Team not found');
    }

    if (data.name && data.name !== existingTeam.name) {
      const nameTaken = await teamsRepository.findByName(data.name);
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

  async delete(id: string) {
    const existing = await teamsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Team not found');
    }
    return teamsRepository.delete(id);
  }
}

export const teamsService = new TeamsService();