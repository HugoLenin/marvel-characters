import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Character } from './character.entity.js';
import { Team } from '../teams/team.entity.js';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { FilterCharactersDto } from './dto/filter-characters.dto.js';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character) private readonly charactersRepository: Repository<Character>,
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
  ) {}

  findAll(filters: FilterCharactersDto): Promise<Character[]> {
    const where: FindOptionsWhere<Character> = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.teamId !== undefined) {
      where.team_id = filters.teamId;
    }
    return this.charactersRepository.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Character> {
    const character = await this.charactersRepository.findOne({
      where: { id },
      relations: { team: true },
    });
    if (!character) {
      throw new NotFoundException(`Character with id ${id} not found`);
    }
    return character;
  }

  async create(dto: CreateCharacterDto): Promise<Character> {
    await this.ensureUniqueAlias(dto.alias);
    if (dto.team_id !== undefined && dto.team_id !== null) {
      await this.validateTeam(dto.team_id);
    }
    const character = this.charactersRepository.create(dto);
    const saved = await this.charactersRepository.save(character);
    return this.findOne(saved.id);
  }

  private async ensureUniqueAlias(alias: string, excludeId?: number): Promise<void> {
    const existing = await this.charactersRepository.findOne({ where: { alias } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Character with alias ${alias} already exists`);
    }
  }

  private async validateTeam(teamId: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with id ${teamId} not found`);
    }
    if (!team.active) {
      throw new BadRequestException(`Team with id ${teamId} is not active`);
    }
    return team;
  }
}
