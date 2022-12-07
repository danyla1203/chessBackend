import * as ws from 'websocket';
import { CompletedMove, Game, GameData, UserInGame } from './Game';
import { Request, RequestTypes, ResponseTypes, User } from '../WsServer';
import { Cell, Figure } from './GameProccess';
import { GameList } from './GameList';
import { InactiveGameError } from '../errors/Game/InactiveGame';
import { GameNotFound } from '../errors/Game/NotFound';
import { UserInAnotherGame } from '../errors/Game/UserInAnotherGame';
import { BadRequestError } from '../errors/BadRequest';
import { IncomingMessage, Message } from './GameChat';

enum GameResponseTypes {
  INIT_GAME = 'INIT_GAME',
  GAME_CREATED = 'GAME_CREATED',
  GAME_START = 'GAME_START',
  UPDATE_STATE = 'UPDATE_STATE',
  STRIKE = 'STRIKE',
  SHAH = 'SHAH',
  MATE = 'MATE',
  PLAYER_TIMEOUT = 'PLAYER_TIMEOUT',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

export enum GameTypes {
  START_NEW = 'START_NEW',
  CONNECT_TO_EXISTING_GAME = 'CONNECT_TO_EXISTING_GAME',
  CONNECT_TO_GAME_AS_SPECTATOR = 'CONNECT_TO_GAME_AS_SPECTATOR',
  MAKE_TURN = 'MAKE_TURN',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
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
export type MakeTurnBody = {
  type: GameTypes.MAKE_TURN
  gameId: number
  body: TurnData
}
type ConnectToGameBody = {
  type: GameTypes.CONNECT_TO_EXISTING_GAME
  gameId: number
}

export type GameRequest = Request & {
  type: RequestTypes.Game
  body: CreateNewGameBody|MakeTurnBody|ConnectToGameBody
}

export class GameRouter {
  GameList: GameList;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;

  constructor(
    GameList: GameList,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void,
  ) {
    this.sendMessage = sendMessage;
    this.GameList = GameList;
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
      if (strikedData) this.sendGameMessage(game.players[player].conn, GameResponseTypes.STRIKE, strikedData);
      if (shah) this.sendGameMessage(game.players[player].conn, GameResponseTypes.SHAH, shah);
      if (mate) this.sendGameMessage(game.players[player].conn, GameResponseTypes.MATE, mate);
    }
    //TODO: send move result to spectators
  }
  
  private startNewGameHandler(user: User, gameConfig: GameConfig): void {
    if (this.GameList.isUserInGameAlready(user.userId)) throw new UserInAnotherGame();

    const game = new Game(user, (users: UserInGame[], data: GameData) => {
      users.forEach(({ conn }: UserInGame) => {
        this.sendGameMessage(conn, GameResponseTypes.PLAYER_TIMEOUT, data);
      });
    }, gameConfig);

    this.GameList.addGame(game);    
    this.sendGameMessage(user.conn, GameResponseTypes.GAME_CREATED, {});
  }
  
  private connectToGameAsSpectatorHandler(user: User, gameId?: number): void {
    const game: Game|null = this.GameList.findGame(gameId);

    if (!game) throw new GameNotFound();
    game.addSpectator(user);
    this.sendGameMessage(user.conn, GameResponseTypes.INIT_GAME, game.initedGameData(user.userId));
  }

  private connectToGameHandler(user: User, gameId?: number): void {
    if (this.GameList.isUserInGameAlready(user.userId)) throw new UserInAnotherGame();

    const game: Game|null = this.GameList.findGame(gameId);

    if (!game) throw new GameNotFound();
    game.addPlayer(user);
    game.start();
    
    Object.keys(game.players).map((playerId: string) => {
      const player = game.players[parseInt(playerId)];
      this.sendGameMessage(player.conn, GameResponseTypes.INIT_GAME, game.initedGameData(parseInt(playerId)));
      this.sendGameMessage(player.conn, GameResponseTypes.GAME_START, {});
    });
  } 

  private makeTurnHandler(user: User, moveData: MakeTurnBody): void {
    if (!Game.isMakeTurnRequestValid(moveData)) throw new BadRequestError('Bad request');
    const game: Game|null = this.GameList.findGame(moveData.gameId);
    if (!game) throw new GameNotFound();
    if (!game.isActive) throw new InactiveGameError();
    
    const result: CompletedMove = game.makeTurn(user.userId, moveData.body);
    this.sendTurnResultToUsers(game, result);
  }

  private chatMessageHandler(user: User, gameId: number, message: IncomingMessage): void {
    const game: Game|null = this.GameList.findGame(gameId);
    if (!game) throw new GameNotFound();

    const result: Message|null = game.chatMessage(user.userId, message);
    if (result) {
      Object.keys(game.players).map((playerId: string) => {
        const player = game.players[parseInt(playerId)];
        this.sendGameMessage(player.conn, GameResponseTypes.CHAT_MESSAGE, { message: result });
      });
    } else throw new BadRequestError('Incorrect message');
  }

  public handleMessage(user: User , { body }: GameRequest): void {
    if (!body.type) throw new BadRequestError('No body type');
    switch (body.type) {
    case GameTypes.START_NEW:
      this.startNewGameHandler(user, body.body);
      break;
    case GameTypes.CONNECT_TO_EXISTING_GAME:
      this.connectToGameHandler(user, body.body.gameId);
      break;
    case GameTypes.MAKE_TURN:
      this.makeTurnHandler(user, body);
      break;
    case GameTypes.CONNECT_TO_EXISTING_GAME:
      this.connectToGameAsSpectatorHandler(user, body.body.gameId);
      break;
    case GameTypes.CHAT_MESSAGE:
      this.chatMessageHandler(user, body.body.gameId, body.body.message);
      break;
    }
  }
}