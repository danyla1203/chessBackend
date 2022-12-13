import * as ws from 'websocket';
import { Game, GameData } from './Game';
import { ResponseTypes, ConnectedUser } from '../WsServer';

export class GameList {
  games: Game[];
  lobby: Game[];

  sendBroadcastMessage: (games: GameData[]) => void;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;

  constructor(
    sendBroadcastMessage: (games: GameData[]) => void,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void
  ) {
    this.sendBroadcastMessage = sendBroadcastMessage;
    this.sendMessage = sendMessage;
    this.games = [];
    this.lobby = [];
  }

  public findGameInLobby(gameId: number): Game|null {
    for (const game of this.lobby) {
      if (game.id === gameId) return game;
    }
    return null;
  }
  public findStartedGame(gameId: number): Game|null {
    for (const game of this.games) {
      if (game.id === gameId) return game;
    }
    return null;
  }

  public removeCreatedGameByUser(userId: number) {
    this.lobby = this.lobby.filter((game: Game) => userId in game);
    this.sendLobby();
  }

  public addGame(game: Game): void {
    this.lobby.push(game);
    this.sendLobby();
  }
  public removeGameFromLobby(gameId: number): void {
    const index: number = this.lobby.findIndex((game: Game) => game.id === gameId);
    this.games.push(this.lobby[index]);
    this.lobby.splice(index, 1);
    this.sendLobby();
  }

  public sendLobby(): void {
    const gameDatas: GameData[] = this.lobby.map((game) => game.gameData());
    this.sendBroadcastMessage(gameDatas);
  }

  public sendLobbyToConnectedUser(user: ConnectedUser): void {
    const gameDatas: GameData[] = this.lobby.map((game) => game.gameData());
    this.sendMessage(user.conn, ResponseTypes.GameList, gameDatas);
  }

}