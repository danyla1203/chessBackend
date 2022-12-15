import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm'; 
import { GameEntity } from './GameEntity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
    id: number;
  @Column()
    name: string;
  @Column({ unique: true })
    email: string;
  @Column()
    password: string;
  @ManyToMany(() => GameEntity, (game) => game.playersId, { cascade: true })
  @JoinTable({ name: 'users_games' })
    games: GameEntity[];
}