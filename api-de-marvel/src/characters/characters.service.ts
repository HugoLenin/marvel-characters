import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Character } from './character.entity.js';
import { Team } from '../teams/team.entity.js';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { FilterCharactersDto } from './dto/filter-characters.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';
import { CharacterStatus } from './character-status.enum.js';

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

  async update(id: number, dto: UpdateCharacterDto): Promise<Character> {
    const character = await this.findOne(id);
    await this.ensureUniqueAlias(dto.alias, id);
    this.ensureValidTransition(character.status, dto.status);
    const teamId = dto.team_id ?? null;
    if (teamId !== null && teamId !== character.team_id) {
      await this.validateTeam(teamId);
    }
    await this.charactersRepository.update(id, {
      real_name: dto.real_name,
      alias: dto.alias,
      main_power: dto.main_power,
      power_level: dto.power_level,
      status: dto.status,
      is_villain: dto.is_villain,
      team_id: teamId,
    });
    return this.findOne(id);
  }

  async updateStatus(id: number, status: CharacterStatus): Promise<Character> {
    const character = await this.findOne(id);
    this.ensureValidTransition(character.status, status);
    await this.charactersRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.charactersRepository.delete(id);
  }

  private ensureValidTransition(current: CharacterStatus, next: CharacterStatus): void {
    if (current === CharacterStatus.RETIRED && next === CharacterStatus.INJURED) {
      throw new BadRequestException('A RETIRED character cannot change to INJURED');
    }
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
