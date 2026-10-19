import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './character.entity.js';
import { Team } from '../teams/team.entity.js';
import { CharactersService } from './characters.service.js';
import { CharactersController } from './characters.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Team])],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
