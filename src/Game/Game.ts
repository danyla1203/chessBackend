import { BadRequestError } from '../errors/BadRequest';
import { BadMoveError } from '../errors/Game/BadMove';
import { makeId } from '../tools/createUniqueId';
import { ConnectedUser } from '../WsServer';
import { FiguresState, GameProccess, MateData, ShahData, StrikedData } from './GameProccess';
import { GameConfig, MakeTurnBody, TurnData } from './GameHandler';
import { GameChat, IncomingMessage, MessageData } from './GameChat';
import { GameService } from '../GameAPI/GameService';
import { gameService } from '../service.modulе';

export type Player = ConnectedUser & {
  side: 'w' | 'b'
  timeRemain: number
  moveTurnStartDate?: Date
  endGameTimer?: NodeJS.Timer
}
export type Spectator = {}

export type CompletedMove = {
  mate?: null|MateData
  shah?: null|ShahData
  strikedData?: null|StrikedData
}

type PlayerData = {
  id: string
  name: string
}
export type GameData = {
  id: number
  spectators: number
  players: PlayerData[]
  isActive: boolean
  maxTime: number
  timeIncrement: number
  side: 'w'|'b'|'rand';
}
export class Game {
  id: number;
  maxTime: number;
  timeIncrement: number;
  side: 'w'|'b'|'rand';
  spectators: { [k: number]: Spectator };
  players: { [k: number]: Player };
  process: GameProccess;
  chat: GameChat;
  isActive: boolean;
  isOver: boolean;
  endGameByTimeout: (usersInGame: ConnectedUser[], gameData: GameData) => void;
  GameService: GameService;

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

  private endGame(): void {
    this.isActive = false;
    this.isOver = true;
    for (let player in this.players) clearTimeout(this.players[player].endGameTimer);

    let savingToDb = true;
    for (let player in this.players) {
      if (!this.players[player]) savingToDb = false;
    }
    if (!savingToDb) return;

    this.GameService.saveGame(this);
  }

  constructor(
    user: ConnectedUser,
    sendGameEndByTimeoutCallback: (usersInGame: ConnectedUser[], gameData: GameData) => void,
    { side, time, timeIncrement }: GameConfig, 
  ) {
    this.id = makeId();
    const player = Object.assign({
      timeRemain: time,
      side: null
    }, user);
    if (side === 'w' || side === 'b') player.side = side;
    else if (side === 'rand') {
      const sides: ['w', 'b'] = [ 'w', 'b' ];
      player.side = sides[Math.floor(Math.random() * 2)];
    }
    this.side = side;
    this.players = { [user.id]: player };
    this.maxTime = time;
    this.timeIncrement = timeIncrement;
    this.spectators = {};
    this.process = new GameProccess();
    this.chat = new GameChat(user.id);
    this.isActive = false;
    this.isOver = false;
    this.endGameByTimeout = sendGameEndByTimeoutCallback;
    this.GameService = gameService;
  }
  public gameData(): GameData {
    const playersData = [];
    for (const userId in this.players) {
      playersData.push({ id: userId, name: this.players[userId].name });
    }
    return {
      id: this.id,
      spectators: Object.values(this.spectators).length,
      players: playersData,
      isActive: this.isActive,
      maxTime: this.maxTime,
      timeIncrement: this.timeIncrement,
      side: this.side
    };
  }
  public initedGameData(userId: number) {
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
  public addPlayer(user: ConnectedUser): void {
    const playerSide: 'w'|'b' = Object.values(this.players)[0].side;
    const newPlayerSide: 'w'|'b' = playerSide === 'w' ? 'b':'w';
    this.players[user.id] = Object.assign({
      side: newPlayerSide,
      timeRemain: this.maxTime
    }, user);
    this.chat.addChatParticipant(user.id);
  }

  public addSpectator(user: ConnectedUser): void {
    this.spectators[user.id ] = {
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
          console.log('\n');
          console.log(this.players);
          this.endGameByTimeout(Object.values(this.players), {});
          this.endGame();
        }
      }.bind(this), this.maxTime);
    });
  }

  public makeTurn(playerId: number, turn: TurnData): null|CompletedMove {
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
    if (mate) this.endGame();

    this.process.setMoveSide();
    
    const timeChange = this.timeIncrement - (Date.now() - Date.parse(moveTurnStartDate.toString()));
    this.players[playerId].timeRemain += timeChange;
    
    side === 'w' ?
      this.findPlayerBySide('b').moveTurnStartDate = new Date():
      this.findPlayerBySide('w').moveTurnStartDate = new Date();

    return { 
      mate: mate,
      shah: shah,
      strikedData: striked
    };
  }
  public chatMessage(userId: number, message: IncomingMessage): MessageData {
    return this.chat.addMessage(userId, message);
  }
  public actualState(): FiguresState {
    return this.process.state();
  }
}
