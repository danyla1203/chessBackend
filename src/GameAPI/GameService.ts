import { PrismaClient } from '@prisma/client';
import { UserWithoutPassword } from '../Auth/AuthService';
import { Game, Player } from '../Game/Game';

export class GameService {
  prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  public async saveGame(game: Game): Promise<void> {
    const ids = Object.values(game.players).map((player: Player) => player.id);
    await this.prisma.game.create({
      data: {
        maxTime: game.maxTime,
        timeIncrement: game.timeIncrement,
        sideSelecting: game.side,
        players: {
          connect: [ { id: ids[0] }, { id: ids[1] } ]
        } 
      }
    });
  }
  public getGamesByUserId(user: UserWithoutPassword) {
    return this.prisma.user.findUnique({
      select: {
        games: true
      },
      where: { id: user.id }
    });
  }
}
