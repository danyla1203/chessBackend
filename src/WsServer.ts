import * as ws from 'websocket';
import { randomBytes } from 'crypto';
import { Game, Player, TurnData } from "./Game/Game";

type Response = {
  type: string;
  payload: any;
}
export class WsServer {
  ws: ws.server;
  games: Game[];
  constructor(ws: ws.server) {
    this.ws = ws;
    this.games = [];
  }

  //Use in dev mode to mock ip address
  private makeId(): string {
    return randomBytes(10).toString('hex');
  }

  private connectToGame(path: string, newConn: ws.connection, playerId: string): Game | undefined {
    if (Game.isNewGame(path, this.games)) {
      const game = new Game(path, newConn, playerId);
      this.games.push(game);
      return game;
    } else {
      const game = Game.findGame(path, playerId, this.games);
      if (game) {
        game.addPlayer(newConn, playerId);
        game.start();
      }
      return game;
    }
  }

  private sendMessage(conn: ws.connection, type: string, payload: any) {
    const data: Response = {
      type: type,
      payload: payload
    }
    conn.sendUTF(JSON.stringify(data));
  }

  public run() {
    this.ws.on('request', (req: ws.request) => {
      const newConn: ws.connection = req.accept('echo-protocol', req.origin);
      const PATH: string = req.resourceURL.path.split("/")[1];
      const PlayerId = this.makeId();

      const game: Game | undefined = this.connectToGame(PATH, newConn, PlayerId);
      if (game) {
        this.sendMessage(newConn, 'INIT_GAME', {board: game.actualState()});
        newConn.on('message', (message: ws.Message) => {
          if (message.type == 'utf8' && game.isActive) {
            let data: TurnData = JSON.parse(message.utf8Data);
            data.playerId = PlayerId;
            game.makeTurn(data);
            game.couple.map((player: Player) => {
              this.sendMessage(player.conn, 'UPDATE_STATE', game.actualState());
            })
          }
        });
      } 
    });
  }
}
