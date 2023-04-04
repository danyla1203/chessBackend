import { Game, GameData } from '../game';
import { SSECaller, ConnectedUser } from '../../ws';

export class GameList implements SSECaller {
  games: Game[];
  lobby: Game[];

  sendBroadcastMessage: (type: any, data: GameData[]) => void;
  sendMessage: (user: ConnectedUser, type: any, payload: any) => void;

  constructor() {
    this.games = [];
    this.lobby = [];
  }
  init(
    sendMessage: (user: ConnectedUser, type: any, payload: any) => void,
    sendBroadcastMessage: (type: any, data: GameData[]) => void,
  ) {
    this.sendBroadcastMessage = sendBroadcastMessage;
    this.sendMessage = sendMessage;
  }

  onRequest() {
    return this.lobby.map((game) => game.gameData());
  }
  onCloseConn(user: ConnectedUser) {
    this.lobby = this.lobby.filter((game: Game) => user.id in game);
    this.sendLobby();
  }

  public findGameInLobby(gameId: number): Game | null {
    for (const game of this.lobby) {
      if (game.id === gameId) return game;
    }
    return null;
  }
  public findStartedGame(gameId: number): Game | null {
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
    const index: number = this.lobby.findIndex(
      (game: Game) => game.id === gameId,
    );
    this.games.push(this.lobby[index]);
    this.lobby.splice(index, 1);
    this.sendLobby();
  }

  public sendLobby(): void {
    const gameDatas: GameData[] = this.lobby.map((game) => game.gameData());
    this.sendBroadcastMessage('LOBBY', gameDatas);
  }
}