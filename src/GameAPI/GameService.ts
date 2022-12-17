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
    const player1 = game.players[ids[0]];
    const player2 = game.players[ids[1]];
    await this.prisma.game.create({
      data: {
        maxTime: game.maxTime,
        timeIncrement: game.timeIncrement,
        sideSelecting: game.side,
        players: {
          create: [
            {
              side: player1.side,
              isWinner: game.winner === player1.id,
              user: { connect: { id: player1.id } }
            },
            {
              side: player2.side,
              isWinner: game.winner === player2.id,
              user: { connect: { id: player2.id  } }
            }
          ]
        }
      }
    });
  }
  public async getGamesByUserId(user: UserWithoutPassword) {
    const games = await this.prisma.game.findMany({
      select: {
        id: true,
        maxTime: true,
        timeIncrement: true,
        sideSelecting: true,
        players: {
          select: {
            side: true,
            isWinner: true,
            user: {
              select: { id: true, name: true },
            }
          }
        }
      },
      where: {
        players: {
          some: {
            userId: user.id
          }
        }
      }
    });
    return { items: games };
  }
}
