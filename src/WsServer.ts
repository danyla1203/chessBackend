import * as ws from 'websocket';
import { GameRequest, GameRouter } from './Game/GameRouter';
import { makeId } from './tools/createUniqueId';

enum ErrorTypes {
  BAD_REQUEST = 'BAD_REQUEST',
}

type Response = {
  type: any,
  payload: any;
}

export enum RequestTypes {
  Game = 'Game',
  GameChat = 'GameChat'
}
export enum ResponseTypes {
  Game = 'Game',
  GameChat = 'GameChat'
}

export type User = {
  userId: string;
  conn: ws.connection
}

export type Request = {
  type?: RequestTypes,
  body?: any
}

export class WsServer {
  ws: ws.server;
  users: User[];
  GameRouter: GameRouter;

  constructor(ws: ws.server) {
    this.ws = ws;
    this.users = [];
    this.GameRouter = new GameRouter(this.sendMessage, this.sendErrorMessage);
  }

  private sendErrorMessage(conn: ws.connection, errType: ErrorTypes, errMessage: string): void {
    const data: Response = { type: errType, payload: { errMessage } };
    conn.sendUTF(JSON.stringify(data));
  }
  private sendMessage(conn: ws.connection, type: ResponseTypes, payload: any): void {
    const data: Response = { type, payload };
    conn.sendUTF(JSON.stringify(data));
  }

  private isMessageStructValid(parsedMessage: any): boolean {
    if (typeof parsedMessage !== 'object') return false;
    if (!parsedMessage.type) return false;
    if (!parsedMessage.body) return false;
    return true;
  }
  private parseMessage(message: ws.Message): Request|null {
    if (message.type == 'utf8' ) {
      try {
        return JSON.parse(message.utf8Data);
      } catch (e: any) {
        return null;
      }
    }
  }
  
  public run() {
    this.ws.on('request', (req: ws.request) => {
      console.log('connect');
      const newConn: ws.connection = req.accept('echo-protocol', req.origin);
      const userId: string = makeId();

      const user: User = { conn: newConn, userId };
      this.users.push(user);
      newConn.sendUTF('connected');
      newConn.on('message', (message: ws.Message) => {
        const parsedMessage: Request|null = this.parseMessage(message);
        if (!parsedMessage || !this.isMessageStructValid(parsedMessage)) {
          this.sendErrorMessage(newConn, ErrorTypes.BAD_REQUEST, 'Message is invalid');
        }

        switch (parsedMessage.type) {
        case RequestTypes.Game:
          this.GameRouter.handleMessage(user, parsedMessage as GameRequest);
          break;
        }
      });
    });
  }
}
