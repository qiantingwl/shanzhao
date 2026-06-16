import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_bans')
export class UserBan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  userId: string;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 0 })
  banDay: number;

  @Column({ length: 255, nullable: true })
  banReason: string;

  @Column({ default: 2 })
  banAuthority: number;

  @Column({ nullable: true })
  createTime: Date;

  @Column({ nullable: true })
  secureTime: Date;

  @Column({ length: 1, default: '0' })
  delFlag: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
