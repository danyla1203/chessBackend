import * as ws from 'websocket';
import { CompletedMove, Game } from './Game';
import { Request, RequestTypes, ResponseTypes, User } from '../WsServer';
import { Cell, Figure } from './GameProccess';
import { GameList } from '../GameList/GameList';

enum GameResponseTypes {
  INIT_GAME = 'INIT_GAME',
  UPDATE_STATE = 'UPDATE_STATE',
  STRIKE = 'STRIKE',
  SHAH = 'SHAH',
  MATE = 'MATE'
}
enum ErrorTypes {
  BAD_REQUEST = 'BAD_REQUEST',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_IS_INACTIVE = 'GAME_IS_INACTIVE',
  USER_ALREADY_IN_GAME = 'USER_ALREADY_IN_GAME'
}

export enum GameTypes {
  START_NEW = 'START_NEW',
  CONNECT_TO_EXISTING_GAME = 'CONNECT_TO_EXISTING_GAME',
  CONNECT_TO_GAME_AS_SPECTATOR = 'CONNECT_TO_GAME_AS_SPECTATOR',
  MAKE_TURN = 'MAKE_TURN'
}

export type TurnData = {
  figure?: Figure,
  cell?: Cell,
}
type CreateNewGameData = {

}

type CreateNewGameBody = {
  type: GameTypes.START_NEW,
  payload: CreateNewGameData
}
type MakeTurnBody = {
  type: GameTypes.MAKE_TURN,
  gameId: string
  body: TurnData
}
type ConnectToGameBody = {
  type: GameTypes.CONNECT_TO_EXISTING_GAME,
  gameId: string
}
 

export type GameRequest = Request & {
  type: RequestTypes.Game,
  body: CreateNewGameBody|MakeTurnBody|ConnectToGameBody
}

export class GameRouter {
  games: Game[];
  GameList: GameList;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;
  sendErrorMessage: (conn: ws.connection, errType: ErrorTypes, errMessage: string) => void;

  constructor(
    GameList: GameList,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void,
    sendError: (conn: ws.connection, errType: ErrorTypes, errMessage: string) => void
  ) {
    this.sendMessage = sendMessage;
    this.sendErrorMessage = sendError;
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
      this.sendGameMessage(game.players[player].conn, GameResponseTypes.UPDATE_STATE, boards);
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
  
  private initGameData(game: Game) {
    const { white, black } = game.actualState();
    const boards = {
      white: Object.fromEntries(white),
      black: Object.fromEntries(black)
    };

    const payload: any = { board: boards, gameId: game.id, side: Object.values(game.players)[0].side }; 
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

  private startNewGameRout(user: User): void {
    if (this.isUserInGameAlready(user.userId)) {
      this.sendErrorMessage(user.conn, ErrorTypes.USER_ALREADY_IN_GAME, 'User in another game');
      return;
    }

    const game = new Game(user);
    game.start();
    this.games.push(game);

    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, this.initGameData(game));
    this.GameList.handleNewGame(this.games);
  }
  private connectToGameAsSpectatorRout(user: User, gameId?: string): void {
    const game: Game|null = this.findGame(gameId);

    if (!game) {
      this.sendErrorMessage(user.conn, ErrorTypes.GAME_NOT_FOUND, 'Game not found');
      return;
    }
    game.addSpectator(user);
    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, this.initGameData(game));
  }
  private connectToGameRout(user: User, gameId?: string): void {
    if (this.isUserInGameAlready(user.userId)) {
      this.sendErrorMessage(user.conn, ErrorTypes.USER_ALREADY_IN_GAME, 'User in another game');
      return;
    }

    const game: Game|null = this.findGame(gameId);

    if (!game) {
      this.sendErrorMessage(user.conn, ErrorTypes.GAME_NOT_FOUND, 'Game not found');
      return;
    }
    game.addPlayer(user);
    game.start();

    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, this.initGameData(game));
  } 

  private isMakeTurnRequestValid(request: MakeTurnBody): boolean {
    if (!request.gameId) return false;
    if (!request.body || !request.body?.cell || !request.body?.figure) return false;
    return true;
  }
  private makeTurnRout(user: User, moveData: MakeTurnBody): void {
    if (!this.isMakeTurnRequestValid(moveData)) {
      this.sendErrorMessage(user.conn, ErrorTypes.BAD_REQUEST, 'Bad request');
      return;
    }
    const game: Game|null = this.findGame(moveData.gameId);
    if (!game) {
      this.sendErrorMessage(user.conn, ErrorTypes.GAME_NOT_FOUND, 'Game not found');
      return;
    }
    if (!game.isActive) {
      this.sendErrorMessage(user.conn, ErrorTypes.GAME_IS_INACTIVE, 'Game is inactive');
      return;
    }
    
    const result: null|CompletedMove = game.makeTurn(user.userId, moveData.body);
    if (!result) {
      this.sendErrorMessage(user.conn, ErrorTypes.BAD_REQUEST, 'Bad move');
      return;
    }
    this.sendTurnResultToUsers(game, result);
  }

  public handleMessage(user: User , request: GameRequest): void {
    if (!request.body.type) {
      this.sendErrorMessage(user.conn, ErrorTypes.BAD_REQUEST, 'No type for body');
      return;
    }

    switch (request.body.type) {
    case GameTypes.START_NEW:
      this.startNewGameRout(user);
      break;
    case GameTypes.CONNECT_TO_EXISTING_GAME:
      this.connectToGameRout(user, request.body.payload.gameId);
      break;
    case GameTypes.MAKE_TURN:
      this.makeTurnRout(user, request.body);
    case GameTypes.CONNECT_TO_EXISTING_GAME:
      this.connectToGameAsSpectatorRout(user, request.body);
    }
  }
}
