import * as ws from 'websocket';
import { Cell, Figure, FiguresState, GameProccess, ShahData, StrikedData } from './GameProccess';

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
export type CompletedMove = {
  shah?: null|ShahData,
  strikedData?: null|StrikedData
}
export class Game {
  couple: Player[];
  path: string;
  process: GameProccess;
  isActive: boolean

  static isNewGame(path: string, games: Game[]): boolean {
    for (let i = 0; i < games.length; i++) {
      if (games[i].path == path) return false;
    }
    return true;
  }
  static findGame(path: string, playerId: string, games: Game[]): Game|undefined {
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
  
  public addPlayer(conn: ws.connection, id: string): void {
    this.couple.push({ side: 'b', conn: conn, id: id});
  }
  public start(): void {
    this.isActive = true;
    console.log('Game Start!');
  }

  public makeTurn(turn: TurnData): null|CompletedMove {
    const { figure, cell } = turn;
    const turnSide: 'w'|'b' = this.couple.find((player) => {
      return player.id == turn.playerId;
    }).side;
    if (!this.process.verifyIncomingData(turnSide, figure, cell)) return null;

    let board, opponent;
    let state = this.process.state();
    if (turnSide == 'w') { board = state.white; opponent = state.black }
    else { board = state.black; opponent = state.white }
    
    if (!this.process.verifyFigureMove(board, opponent, figure, cell)) return null;
    if (this.process.isShahRemainsAfterMove(board, opponent, figure, cell)) return null;
    if (this.process.isShahAppearsAfterMove(board, opponent, figure, cell)) return null;
    this.process.removeShah();
    
    const striked: null|StrikedData = this.process.possibleStrike(turnSide, turn.cell);
    if (striked) this.process.removeFigure(turnSide, striked.figure);
    this.process.updateBoard(figure, cell);
    this.process.checkPossibleShahes();
    this.process.setPossibleShahes(figure, cell);

    const shah: null|ShahData = this.process.setShah(figure);
    this.process.setMoveSide();
    return { 
      shah: shah, 
      strikedData: striked 
    }
  } 
  public actualState(): FiguresState {
    return this.process.state();
  }
}
