import * as ws from 'websocket';
import { CompletedMove, Game, GameData, Player, UserInGame } from './Game';
import { Request, RequestTypes, ResponseTypes, User } from '../WsServer';
import { Cell, Figure } from './GameProccess';
import { GameList } from '../GameList/GameList';
import { InactiveGameError } from '../errors/Game/InactiveGame';
import { GameNotFound } from '../errors/Game/NotFound';
import { UserInAnotherGame } from '../errors/Game/UserInAnotherGame';
import { BadRequestError } from '../errors/BadRequest';

enum GameResponseTypes {
  INIT_GAME = 'INIT_GAME',
  GAME_START = 'GAME_START',
  UPDATE_STATE = 'UPDATE_STATE',
  STRIKE = 'STRIKE',
  SHAH = 'SHAH',
  MATE = 'MATE',
  PLAYER_TIMEOUT = 'PLAYER_TIMEOUT'
}

export enum GameTypes {
  START_NEW = 'START_NEW',
  CONNECT_TO_EXISTING_GAME = 'CONNECT_TO_EXISTING_GAME',
  CONNECT_TO_GAME_AS_SPECTATOR = 'CONNECT_TO_GAME_AS_SPECTATOR',
  MAKE_TURN = 'MAKE_TURN'
}

export type TurnData = {
  figure?: Figure
  cell?: Cell
}
export type GameConfig = {
  side: 'rand'|'w'|'b'
  time: number
  timeIncrement: number
}

type CreateNewGameBody = {
  type: GameTypes.START_NEW
  body: GameConfig
}
type MakeTurnBody = {
  type: GameTypes.MAKE_TURN
  gameId: string
  body: TurnData
}
type ConnectToGameBody = {
  type: GameTypes.CONNECT_TO_EXISTING_GAME
  gameId: string
}

export type GameRequest = Request & {
  type: RequestTypes.Game
  body: CreateNewGameBody|MakeTurnBody|ConnectToGameBody
}

export class GameRouter {
  games: Game[];
  GameList: GameList;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;

  constructor(
    GameList: GameList,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void,
  ) {
    this.sendMessage = sendMessage;
    this.games = [];
    this.GameList = GameList;
  }

  private findGame(gameId: string): Game|null {
    for (const game of this.games) {
      if (game.id === gameId) return game;
    }
    return null;
  }
  private sendGameMessage(conn: ws.connection, type: GameResponseTypes, payload: any): void {
    this.sendMessage(conn, ResponseTypes.Game, { type, payload });
  }

  private sendTurnResultToUsers(game: Game, { shah, mate, strikedData }: CompletedMove): void {
    for (const player in game.players) {
      const actualState = game.actualState();
      const boards = {
        white: Object.fromEntries(actualState.white),
        black: Object.fromEntries(actualState.black)
      };
      this.sendGameMessage(game.players[player].conn, GameResponseTypes.UPDATE_STATE, { board: boards });
      if (strikedData) {
        this.sendGameMessage(game.players[player].conn, GameResponseTypes.STRIKE, strikedData);
      }
      if (shah) {
        this.sendGameMessage(game.players[player].conn, GameResponseTypes.SHAH, shah);
      }
      if (mate) {
        this.sendGameMessage(game.players[player].conn, GameResponseTypes.MATE, mate);
      }
    }
    //TODO: send move result to spectators
  }
  
  private initGameData(userId: string, game: Game) {
    const { white, black } = game.actualState();
    const boards = {
      white: Object.fromEntries(white),
      black: Object.fromEntries(black)
    };

    const payload: any = { 
      board: boards, 
      gameId: game.id, 
      side: game.players[userId].side,
      maxTime: game.maxTime,
      timeIncrement: game.timeIncrement
    }; 
    return payload;
  }

  private isUserInGameAlready(userId: string): boolean {
    for (const game of this.games) {
      if (game.players[userId] || game.spectators[userId]) {
        return true;
      }
    }
    return false;
  }

  private startNewGameRout(user: User, gameConfig: GameConfig): void {
    if (this.isUserInGameAlready(user.userId)) throw new UserInAnotherGame();

    const game = new Game(user, (users: UserInGame[], data: GameData) => {
      users.forEach(({ conn }: UserInGame) => {
        this.sendGameMessage(conn, GameResponseTypes.PLAYER_TIMEOUT, data);
      });
    }, gameConfig);
    this.games.push(game);
    
    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, this.initGameData(user.userId, game));
    this.GameList.handleNewGame(this.games);
  }
  private connectToGameAsSpectatorRout(user: User, gameId?: string): void {
    const game: Game|null = this.findGame(gameId);

    if (!game) throw new GameNotFound();
    game.addSpectator(user);
    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, this.initGameData(user.userId, game));
  }
  private connectToGameRout(user: User, gameId?: string): void {
    if (this.isUserInGameAlready(user.userId)) throw new UserInAnotherGame();

    const game: Game|null = this.findGame(gameId);

    if (!game) throw new GameNotFound();
    game.addPlayer(user);
    game.start();

    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, this.initGameData(user.userId, game));
    Object.values(game.players).map((player: Player) => {
      this.sendGameMessage(player.conn, GameResponseTypes.GAME_START, {});
    });
  } 

  private isMakeTurnRequestValid(request: MakeTurnBody): boolean {
    if (!request.gameId) return false;
    if (!request.body || !request.body?.cell || !request.body?.figure) return false;
    return true;
  }
  private makeTurnRout(user: User, moveData: MakeTurnBody): void {
    if (!this.isMakeTurnRequestValid(moveData)) throw new BadRequestError('Bad request');
    const game: Game|null = this.findGame(moveData.gameId);
    if (!game) throw new GameNotFound();
    if (!game.isActive) throw new InactiveGameError();
    
    const result: CompletedMove = game.makeTurn(user.userId, moveData.body);
    this.sendTurnResultToUsers(game, result);
  }

  public handleMessage(user: User , { body }: GameRequest): void {
    if (!body.type) throw new BadRequestError('No body type');
    switch (body.type) {
    case GameTypes.START_NEW:
      this.startNewGameRout(user, body.body);
      break;
    case GameTypes.CONNECT_TO_EXISTING_GAME:
      this.connectToGameRout(user, body.body.gameId);
      break;
    case GameTypes.MAKE_TURN:
      this.makeTurnRout(user, body);
      break;
    case GameTypes.CONNECT_TO_EXISTING_GAME:
      this.connectToGameAsSpectatorRout(user, body.body.gameId);
      break;
    }
  }
}
