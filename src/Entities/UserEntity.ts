import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'; 

type Game = { id: string }

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
  @Column('jsonb', { default: [] })
    games: Game[];
}