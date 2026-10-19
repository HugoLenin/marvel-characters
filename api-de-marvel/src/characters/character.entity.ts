import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Team } from '../teams/team.entity.js';
import { CharacterStatus } from './character-status.enum.js';

@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  real_name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  alias: string;

  @Column({ type: 'varchar', length: 150 })
  main_power: string;

  @Column({ type: 'integer' })
  power_level: number;

  @Column({ type: 'varchar', length: 20, default: CharacterStatus.ACTIVE })
  status: CharacterStatus;

  @Column({ type: 'boolean', default: false })
  is_villain: boolean;

  @Column({ type: 'integer', nullable: true })
  team_id: number | null;

  @ManyToOne(() => Team, (team) => team.characters, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Relation<Team> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
