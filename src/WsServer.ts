import * as ws from 'websocket';
import { randomBytes } from 'crypto';
import { Game, Player } from "./Game/Game";

export class WsServer {
  ws: ws.server;
  games: Game[];
  constructor(ws: ws.server) {
    this.ws = ws;
    this.games = [];
  }

  //Use in dev mode to mock ip address
  private makeIp(): string {
    return randomBytes(10).toString('hex');
  }

  public run() {
    this.ws.on('request', (req: ws.request) => {
      const newConn: ws.connection = req.accept('echo-protocol', req.origin);
      const PATH: string = req.resourceURL.path.split("/")[1];
      
      if (Game.isNewGame(PATH, this.games)) {
        this.games.push(new Game(PATH, newConn));
      } else {
        const game: Game = Game.findGame(PATH, newConn, this.games);
        if (game) {
          game.addPlayer(newConn);
          game.start();
          newConn.on('message', (message: ws.Message) => {
            if (message.type == 'utf8') {
              let data = JSON.parse(message.utf8Data);
              game.makeTurn(data);
              game.couple.map((player: Player) => {
                
              })
            }
          });
        }
      }
    });
  }
}
