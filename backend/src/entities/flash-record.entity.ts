import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Flash } from './flash.entity';
import { User } from './user.entity';

@Entity('flash_records')
export class FlashRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  flashId: string;

  @ManyToOne(() => Flash, (flash) => flash.records, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'flashId' })
  flash: Flash;

  @Column({ length: 64, nullable: true })
  userId: string;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 1, default: '0' })
  recordMode: string;

  @Column({ nullable: true })
  viewSec: number;

  @Column({ length: 1, default: '0' })
  screenFlag: string;

  @CreateDateColumn()
  createdAt: Date;
}
