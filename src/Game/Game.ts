import * as ws from 'websocket';
import { BadRequestError } from '../errors/BadRequest';
import { BadMoveError } from '../errors/Game/BadMove';
import { makeId } from '../tools/createUniqueId';
import { User } from '../WsServer';
import { FiguresState, GameProccess, MateData, ShahData, StrikedData } from './GameProccess';
import { GameConfig, MakeTurnBody, TurnData } from './GameHandler';
import { GameChat, IncomingMessage, MessageData } from './GameChat';

export type UserInGame = {
  conn: ws.connection;
}
export type Player = UserInGame & {
  side: 'w' | 'b'
  timeRemain: number,
  moveTurnStartDate?: Date,
  endGameTimer?: NodeJS.Timer;
}
export type Spectator = {}

export type CompletedMove = {
  mate?: null|MateData
  shah?: null|ShahData
  strikedData?: null|StrikedData
}

type PlayerData = {
  id: string
}
export type GameData = {
  id: string
  spectators: number
  players: PlayerData[]
  isActive: boolean
}
export class Game {
  id: string;
  maxTime: number;
  timeIncrement: number;
  spectators: { [k: string]: Spectator };
  players: { [k: string]: Player };
  process: GameProccess;
  chat: GameChat;
  isActive: boolean;
  endGameByTimeout: (usersInGame: UserInGame[], gameData: GameData) => void;

  static isMakeTurnRequestValid(request: MakeTurnBody): boolean {
    if (!request.gameId) return false;
    if (!request.body || !request.body?.cell || !request.body?.figure) return false;
    return true;
  }

  private findPlayerBySide(side: 'w'|'b'): Player {
    for (const player of Object.values(this.players)) {
      if (player.side === side) return player;
    }
  }

  constructor(
    user: User,
    sendGameEndByTimeoutCallback: (usersInGame: UserInGame[], gameData: GameData) => void,
    { side, time, timeIncrement }: GameConfig, 
  ) {
    this.id = makeId();
    const player: Player = { conn: user.conn, side: null, timeRemain: time };
    if (side === 'w' || side === 'b') player.side = side;
    else if (side === 'rand') {
      const sides: ['w', 'b'] = [ 'w', 'b' ];
      player.side = sides[Math.floor(Math.random() * 2)];
    }
    this.players = { [user.userId]: player };
    this.maxTime = time;
    this.timeIncrement = timeIncrement;
    this.spectators = {};
    this.process = new GameProccess();
    this.chat = new GameChat(user.userId);
    this.isActive = false;
    this.endGameByTimeout = sendGameEndByTimeoutCallback;
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
  public initedGameData(userId: string) {
    const { white, black } = this.actualState();
    const boards = {
      white: Object.fromEntries(white),
      black: Object.fromEntries(black)
    };

    const payload: any = { 
      board: boards, 
      gameId: this.id,
      side: this.players[userId].side,
      maxTime: this.maxTime,
      timeIncrement: this.timeIncrement
    }; 
    return payload;
  }
  public addPlayer(user: User): void {
    const playerSide: 'w'|'b' = Object.values(this.players)[0].side;
    const newPlayerSide: 'w'|'b' = playerSide === 'w' ? 'b':'w';
    this.players[user.userId] = {
      timeRemain: this.maxTime,
      conn: user.conn,
      side: newPlayerSide
    };
    this.chat.addChatParticipant(user.userId);
  }
  public addSpectator(user: User): void {
    this.spectators[user.userId] = {
      conn: user.conn,
    };
  }
  public start(): void {
    this.isActive = true;
    const startPlayer: Player = this.findPlayerBySide('w');
    startPlayer.moveTurnStartDate = new Date();
    
    Object.values(this.players).map((player: Player) => {
      player.endGameTimer = setTimeout(function endGameTimeout() {
        if (player.moveTurnStartDate) player.timeRemain -= Date.now() - Date.parse(player.moveTurnStartDate.toString());
        if (player.timeRemain > 0) {
          setTimeout(endGameTimeout, player.timeRemain);
        } else {
          this.endGameByTimeout(Object.values(this.players), {});
          this.isActive = false;
        }
      }.bind(this), this.maxTime);
    });

    console.log('Game Start!');
  }

  public makeTurn(playerId: string, turn: TurnData): null|CompletedMove {
    const { figure, cell } = turn;
    const { side, moveTurnStartDate }: Player = this.players[playerId];
    if (!this.process.isIncomingDataValid(side, figure, cell)) throw new BadRequestError('Invalid move data');

    const { board, opponent } = this.process.getBoards();
    if (!this.process.verifyFigureMove(board, opponent, figure, cell)) throw new BadMoveError('Can\'t move this figure in cell');
    if (this.process.isShahRemainsAfterMove(figure, cell)) throw new BadMoveError('Stil shah!');
    if (this.process.isShahAppearsAfterMove(figure, cell)) throw new BadMoveError('Shah appears after this move');
    this.process.removeShah();

    const striked: null|StrikedData = this.process.isStrikeAfterMove(turn.cell);
    if (striked) this.process.removeFigure(this.process.getOpponentSide(), striked.figure);
    this.process.updateBoard(figure, cell);

    this.process.setPossibleShah(figure, cell);
    this.process.setFigureStrikeAroundKn(figure, cell);

    const shah: null|ShahData = this.process.setShah(figure);
    const mate: null|MateData = this.process.setMate(figure, cell);
    this.process.setMoveSide();
    this.players[playerId].timeRemain += this.timeIncrement - (Date.now() - Date.parse(moveTurnStartDate.toString()));
    
    side === 'w' ?
      this.findPlayerBySide('b').moveTurnStartDate = new Date():
      this.findPlayerBySide('w').moveTurnStartDate = new Date();

    return { 
      mate: mate,
      shah: shah,
      strikedData: striked
    };
  }
  public chatMessage(userId: string, message: IncomingMessage): MessageData {
    return this.chat.addMessage(userId, message);
  }
  public actualState(): FiguresState {
    return this.process.state();
  }
}
