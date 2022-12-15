import { Repository, In } from 'typeorm';
import { dataSource } from '../db';
import { GameEntity } from '../Entities/GameEntity';
import { UserEntity } from '../Entities/UserEntity';
import { Game } from '../Game/Game';

export class GameService {
  Game: Repository<GameEntity>;
  User: Repository<UserEntity>;
  constructor() {
    this.Game = dataSource.getRepository(GameEntity);
    this.User = dataSource.getRepository(UserEntity);
  }

  public async saveGame(game: Game): Promise<void> {
    const gameRecord = new GameEntity();
    gameRecord.id = game.id;
    gameRecord.maxTime = game.maxTime;
    gameRecord.timeIncrement = game.timeIncrement;
    gameRecord.sideSelecting = game.side;
    const numberIds = Object.keys(game.players).map((id: string) => parseInt(id));
    gameRecord.playersId = numberIds;
    await this.Game.save(gameRecord);

    const users = await this.User.find({
      where: { id: In(numberIds) },
      relations: { games: true } 
    });
    for (let user of users) user.games.push(gameRecord);
    await this.User.save(users);
    
  }
  public getGamesByUserId(id: number) {
    return this.Game.find({
      relations: { playersId: true },
      where: { playersId: id }
    });
  }
}
