import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'; 
import { UserEntity } from './UserEntity';

@Entity()
export class AuthEntity {
  @PrimaryGeneratedColumn()
    id: number;
  @ManyToOne(() => UserEntity)
    user: number;
  @Column()
    refreshToken: string;
  @Column()
    deviceId: string;
  @Column({ type: 'timestamp with time zone', default: () => `NOW() + INTERVAL '${process.env.JWT_ACCESS_EXPIRES} milliseconds'` })
    expiresIn: Date;
}