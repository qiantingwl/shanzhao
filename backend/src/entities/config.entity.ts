import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_config')
export class SysConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 64 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ length: 256, nullable: true })
  remark: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
