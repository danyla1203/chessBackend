import * as ws from "websocket";
import { Cell, Figure, FiguresState, GameProccess } from './GameProccess';

type TurnData = {
  figure: Figure;
  cell: Cell;
}
export type Player = {
  conn: ws.connection;
  side: 'w' | 'b';
}


export class Game {
  couple: Player[];
  path: string;
  process: GameProccess;

  static isNewGame(path: string, games: Game[]) {
    for (let i = 0; i < games.length; i++) {
      if (games[i].path == path) return false;
    }
    return true;
  }
  static findGame(path: string, user: ws.connection, games: Game[]) {
    return games.find((game) => {
      return game.path == path &&
             game.couple[0].conn !== user &&
             game.couple.length < 2;
    });
  }

  constructor(path: string, initiatorConn: ws.connection) {
    this.couple = [{ conn: initiatorConn, side: 'w' }];
    this.path = path;
    this.process = new GameProccess();
  }
  
  public addPlayer(conn: ws.connection) {
    this.couple.push({ side: 'b', conn: conn});
  }
  public start() {
    console.log("Game Start!", this);
  }

  public makeTurn(turn: TurnData) {
    this.process.makeTurn(turn.figure, turn.cell);
  } 
  public returnActualState(): FiguresState {
    return this.process.state();
  }
}
