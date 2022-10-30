import * as ws from 'websocket';
import { randomBytes } from 'crypto';
import { CompletedMove, Game, Player } from './Game/Game';

enum ResponseTypes {
  INIT_GAME = 'INIT_GAME',
  UPDATE_STATE = 'UPDATE_STATE',
  STRIKE = 'STRIKE',
  SHAH = 'SHAH',
  MATE = 'MATE'
}
enum ErrorTypes {
  BAD_REQUEST = 'BAD_REQUEST',
}
type Response = {
  type: ResponseTypes|ErrorTypes;
  payload: any;
}
export class WsGameServer {
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

  private connectToGame(path: string, newConn: ws.connection, playerId: string): Game {
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

  private sendErrorMessage(conn: ws.connection, errType: ErrorTypes, errMessage: string): void {
    this.sendMessage(conn, errType, { errMessage: errMessage });
  }

  private sendMessage(conn: ws.connection, type: ResponseTypes|ErrorTypes, payload: any): void {
    const data: Response = {
      type: type,
      payload: payload
    };
    conn.sendUTF(JSON.stringify(data));
  }

  private parseRequest(message: ws.Message): any|null {
    if (message.type == 'utf8' ) {
      try {
        return JSON.parse(message.utf8Data).payload;
      } catch (e: any) {
        return null;
      }
    }
  }

  public run() {
    this.ws.on('request', (req: ws.request) => {
      const newConn: ws.connection = req.accept('echo-protocol', req.origin);
      const PATH: string = req.resourceURL.path.split('/')[1];
      const PlayerId = this.makeId();

      const game: Game = this.connectToGame(PATH, newConn, PlayerId);

      const state = game.actualState();
      const boards = {
        white: Object.fromEntries(state.white),
        black: Object.fromEntries(state.black)
      };

      const payload: any = { board: boards, side: null }; 
      if (game.couple.length == 1) {
        payload.side = 'w';
        this.sendMessage(newConn, ResponseTypes.INIT_GAME, payload);
      } else if (game.couple.length == 2) {
        payload.side = 'b';
        this.sendMessage(newConn, ResponseTypes.INIT_GAME, payload);
      }

      newConn.on('message', (message: ws.Message) => {
        if (game.isActive) {
          const req = this.parseRequest(message);
          if (!req) {
            this.sendErrorMessage(newConn, ErrorTypes.BAD_REQUEST, 'Incorrect data');
            return;
          }
          req.playerId = PlayerId;
          const result: null|CompletedMove = game.makeTurn(req);
          if (!result) {
            this.sendErrorMessage(newConn, ErrorTypes.BAD_REQUEST, 'Bad request');
            return;
          }
          game.couple.map((player: Player) => {
            if (result) {
              const actualState = game.actualState();
              let boards = {
                white: Object.fromEntries(actualState.white),
                black: Object.fromEntries(actualState.black)
              };
              this.sendMessage(player.conn, ResponseTypes.UPDATE_STATE, boards);
              if (result.strikedData) {
                this.sendMessage(player.conn, ResponseTypes.STRIKE, result.strikedData);
              }
              if (result.shah) {
                this.sendMessage(player.conn, ResponseTypes.SHAH, result.shah);
              }
              if (result.mate) {
                this.sendMessage(player.conn, ResponseTypes.MATE, result.mate);
              }
            }
          });
        }
      });
    });
  }
}
