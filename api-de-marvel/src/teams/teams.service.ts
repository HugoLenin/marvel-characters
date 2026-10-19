import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from './team.entity.js';
import { Character } from '../characters/character.entity.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
    @InjectRepository(Character) private readonly charactersRepository: Repository<Character>,
  ) {}

  findAll(): Promise<Team[]> {
    return this.teamsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return team;
  }

  async findCharacters(id: number): Promise<Character[]> {
    await this.findOne(id);
    return this.charactersRepository.find({ where: { team_id: id }, order: { id: 'ASC' } });
  }

  async create(dto: CreateTeamDto): Promise<Team> {
    const { characterIds, ...data } = dto;
    await this.ensureUniqueName(data.name);
    const team = this.teamsRepository.create(data);
    if (characterIds?.length) {
      if (team.active === false) {
        throw new BadRequestException('Cannot assign characters to an inactive team');
      }
      await this.findCharactersByIds(characterIds);
    }
    const saved = await this.teamsRepository.save(team);
    if (characterIds?.length) {
      await this.charactersRepository.update({ id: In(characterIds) }, { team_id: saved.id });
    }
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.findOne(id);
    await this.ensureUniqueName(dto.name, id);
    team.name = dto.name;
    team.base = dto.base ?? null;
    team.founded_year = dto.founded_year ?? null;
    team.active = dto.active;
    return this.teamsRepository.save(team);
  }

  async assignCharacters(id: number, characterIds: number[]): Promise<Character[]> {
    const team = await this.findOne(id);
    await this.findCharactersByIds(characterIds);
    if (!team.active) {
      throw new BadRequestException('Cannot assign characters to an inactive team');
    }
    await this.charactersRepository.update({ id: In(characterIds) }, { team_id: id });
    return this.findCharacters(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const count = await this.charactersRepository.count({ where: { team_id: id } });
    if (count > 0) {
      throw new ConflictException('Team has associated characters');
    }
    await this.teamsRepository.delete(id);
  }

  private async ensureUniqueName(name: string, excludeId?: number): Promise<void> {
    const existing = await this.teamsRepository.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Team with name ${name} already exists`);
    }
  }

  private async findCharactersByIds(ids: number[]): Promise<Character[]> {
    const uniqueIds = [...new Set(ids)];
    const characters = await this.charactersRepository.find({ where: { id: In(uniqueIds) } });
    if (characters.length !== uniqueIds.length) {
      const found = new Set(characters.map((c) => c.id));
      const missing = uniqueIds.filter((i) => !found.has(i));
      throw new NotFoundException(`Characters not found: ${missing.join(', ')}`);
    }
    return characters;
  }
}
