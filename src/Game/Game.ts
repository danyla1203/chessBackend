import * as ws from "websocket";
import { Cell, Figure, FiguresState, GameProccess } from './GameProccess';

export type TurnData = {
  playerId: string
  figure: Figure;
  cell: Cell;
}
export type Player = {
  id: string
  conn: ws.connection;
  side: 'w' | 'b';
}


export class Game {
  couple: Player[];
  path: string;
  process: GameProccess;
  isActive: boolean

  static isNewGame(path: string, games: Game[]) {
    for (let i = 0; i < games.length; i++) {
      if (games[i].path == path) return false;
    }
    return true;
  }
  static findGame(path: string, playerId: string, games: Game[]) {
    return games.find((game) => {
      return game.path == path &&
             game.couple[0].id !== playerId &&
             game.couple.length < 2;
    });
  }

  constructor(path: string, initiatorConn: ws.connection, id: string) {
    this.couple = [{ conn: initiatorConn, side: 'w', id: id }];
    this.path = path;
    this.process = new GameProccess();
    this.isActive = false;
  }
  
  public addPlayer(conn: ws.connection, id: string) {
    this.couple.push({ side: 'b', conn: conn, id: id});
  }
  public start() {
    this.isActive = true;
    console.log("Game Start!");
  }

  public makeTurn(turn: TurnData) {
    const sideToTurn = this.couple.find((player) => {
      return player.id == turn.playerId;
    }).side;
    this.process.makeTurn(sideToTurn, turn.figure, turn.cell);
  } 
  public actualState(): FiguresState {
    return this.process.state();
  }
}