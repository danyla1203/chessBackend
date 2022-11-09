import * as ws from 'websocket';
import { Game, GameData } from '../Game/Game';
import { ResponseTypes, User } from '../WsServer';

export class GameList {
  sendBroadcastMessage: (games: GameData[]) => void;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;
  constructor(
    sendBroadcastMessage: (games: GameData[]) => void,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void
  ) {
    this.sendBroadcastMessage = sendBroadcastMessage;
    this.sendMessage = sendMessage;
  }

  public handleNewGame(games: Game[]) {
    const gameDatas: GameData[] = games.map((game: Game) => game.gameData());
    this.sendBroadcastMessage(gameDatas);
  }
  public sendGameListToConnectedUser(user: User, games: Game[]) {
    const gameDatas: GameData[] = games.map((game: Game) => game.gameData());
    console.log(gameDatas);
    this.sendMessage(user.conn, ResponseTypes.GameList, gameDatas);
  }
}