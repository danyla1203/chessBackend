import * as ws from 'websocket';
import { randomBytes } from 'crypto';
import { Game } from "./Game";

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
    this.ws.on('request', (request: ws.request) => {
      const connection = request.accept('echo-protocol', request.origin);
      const PATH = request.resourceURL.path.split("/")[1];
      const IP = this.makeIp();
      
      if (Game.isNewGame(PATH, this.games)) {
        this.games.push(new Game(PATH, IP));
      } else {
        const game = Game.findGame(PATH, IP, this.games);
        if (game) {
          game.addPlayer(IP);
          game.start();
          connection.on('message', (message: ws.Message) => {
            if (message.type == 'utf8') {
              let data = JSON.parse(message.utf8Data);
              game.makeTurn(data);
            }
          });
        }
      }
    });
  }
}
