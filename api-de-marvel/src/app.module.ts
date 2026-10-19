import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TeamsModule } from './teams/teams.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { Team } from './teams/team.entity.js';
import { Character } from './characters/character.entity.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'api-de-marvel',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      username: process.env.DB_USER ?? 'marvel',
      password: process.env.DB_PASSWORD ?? 'marvel123',
      database: process.env.DB_NAME ?? 'marvel_db',
      entities: [Team, Character],
      synchronize: false,
    }),
    TeamsModule,
    CharactersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
