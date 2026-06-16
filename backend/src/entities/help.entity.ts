import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('help')
export class Help {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128 })
  feedName: string;

  @Column({ type: 'text' })
  feedCont: string;

  @Column({ default: 0 })
  sort: number;

  @Column({ length: 1, default: '0' })
  delFlag: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
