import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FlashRecord } from './flash-record.entity';

export enum FlashStatus {
  PENDING = '0',
  PUBLISHED = '1',
  REVOKED = '2',
  REJECTED = '3',
}

@Entity('flash')
export class Flash {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  authorId: string;

  @ManyToOne(() => User, (user) => user.flashes, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ length: 512 })
  filePath: string;

  @Column({ length: 512, nullable: true })
  fileThumb: string;

  @Column({ length: 512, nullable: true })
  fileMasai: string;

  @Column({ length: 512, nullable: true })
  fileShare: string;

  @Column({ length: 1, default: '0' })
  fileOrigin: string;

  @Column({ length: 1, default: '1' })
  originFlag: string;

  @Column({ length: 1, default: '1' })
  screenFlag: string;

  @Column({ length: 1, default: '0' })
  iosFlag: string;

  @Column({ length: 1, default: '1' })
  pcFlag: string;

  @Column({ length: 1, default: '0' })
  shareBlockFlag: string;

  @Column({ length: 1, default: '0' })
  adFlag: string;

  @Column({ length: 20, default: 'entertainment' })
  mode: string;

  @Column({ length: 128, nullable: true })
  activityId: string;

  @Column({ default: 1 })
  maxNum: number;

  @Column({ default: 3 })
  maxSec: number;

  @Column({ type: 'enum', enum: FlashStatus, default: FlashStatus.PUBLISHED })
  status: FlashStatus;

  @Column({ length: 1, default: '0' })
  delFlag: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FlashRecord, (record) => record.flash)
  records: FlashRecord[];
}
