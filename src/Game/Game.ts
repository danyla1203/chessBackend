import * as ws from 'websocket';
import { makeId } from '../tools/createUniqueId';
import { User } from '../WsServer';
import { FiguresState, GameProccess, MateData, ShahData, StrikedData } from './GameProccess';
import { TurnData } from './GameRouter';

export type Player = {
  conn: ws.connection;
  side: 'w' | 'b';
}
export type Spectator = {
  conn: ws.connection
}

export type CompletedMove = {
  mate?: null|MateData;
  shah?: null|ShahData;
  strikedData?: null|StrikedData;
}

type PlayerData = {
  id: string
}
export type GameData = {
  id: string,
  spectators: number,
  players: PlayerData[],
  isActive: boolean;
}
export class Game {
  id: string;
  spectators: { [k: string]: Spectator };
  players: { [k: string]: Player };
  process: GameProccess;
  isActive: boolean;

  constructor(user: User) {
    this.id = makeId();
    this.players = {
      [user.userId]: {
        conn: user.conn,
        side: 'w'
      }
    };
    this.spectators = {};
    this.process = new GameProccess();
    this.isActive = false;
  }
  public gameData(): GameData {
    const playersData = [];
    for (const userId in this.players) {
      playersData.push({ id: userId });
    }
    return {
      id: this.id,
      spectators: Object.values(this.spectators).length,
      players: playersData,
      isActive: this.isActive
    };
  }
  public addPlayer(user: User): void {
    this.players[user.userId] = {
      conn: user.conn,
      side: 'w'
    };
  }
  public addSpectator(user: User): void {
    this.spectators[user.userId] = {
      conn: user.conn,
    };
  }
  public start(): void {
    this.isActive = true;
    console.log('Game Start!');
  }

  public makeTurn(playerId: string, turn: TurnData): null|CompletedMove {
    const { figure, cell } = turn;
    const turnSide: 'w'|'b' = this.players[playerId].side;
    if (!this.process.isIncomingDataValid(turnSide, figure, cell)) return null;

    const { board, opponent } = this.process.getBoards();
    if (!this.process.verifyFigureMove(board, opponent, figure, cell)) return null;
    if (this.process.isShahRemainsAfterMove(figure, cell)) return null;
    if (this.process.isShahAppearsAfterMove(figure, cell)) return null;
    this.process.removeShah();

    const striked: null|StrikedData = this.process.isStrikeAfterMove(turn.cell);
    if (striked) this.process.removeFigure(this.process.getOpponentSide(), striked.figure);
    this.process.updateBoard(figure, cell);
    this.process.checkPossibleShahes();
    this.process.checkFiguresAroundKn();
    this.process.setPossibleShahes(figure, cell);
    this.process.setFiguresStrikeAroundKn(figure);

    const shah: null|ShahData = this.process.setShah(figure);
    const mate: null|MateData = this.process.setMate(figure, cell);
    this.process.setMoveSide();
    return { 
      mate: mate,
      shah: shah, 
      strikedData: striked 
    };
  } 
  public actualState(): FiguresState {
    return this.process.state();
  }
  
}
