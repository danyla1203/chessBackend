import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm'; 
import { UserEntity } from './UserEntity';

@Entity()
export class GameEntity {
  @PrimaryGeneratedColumn()
    id: number;
  @ManyToMany(() => UserEntity, (user) => user.id)
  @JoinTable({ name: 'users_games' })
    playersId: number[];
  @Column()
    maxTime: number;
  @Column()
    timeIncrement: number;
  @Column()
    sideSelecting: 'w'|'b'|'rand';
}