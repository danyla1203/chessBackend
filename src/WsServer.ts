import * as ws from 'websocket';
import { BaseError } from './errors';
import { ErrorTypes } from './errors/types';
import { GameData } from './Game/Game';
import { GameRequest, GameRouter } from './Game/GameRouter';
import { GameList } from './GameList/GameList';
import { makeId } from './tools/createUniqueId';

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
  GameChat = 'GameChat',
  GameList = 'GameList',
  User = 'User',
}

export type User = {
  userId: string,
  name: string,
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
  GameList: GameList;

  constructor(ws: ws.server) {
    this.ws = ws;
    this.users = [];
    this.GameList = new GameList((games: GameData[]) => {
      for (const user of this.users) {
        this.sendMessage(user.conn, ResponseTypes.GameList, games);
      }
    }, this.sendMessage);
    this.GameRouter = new GameRouter(this.GameList, this.sendMessage);
    
  }

  private sendMessage(conn: ws.connection, type: string, payload: any): void {
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
  
  private handleMessage(user: User, message: Request): void {
    switch (message.type) {
    case RequestTypes.Game:
      this.GameRouter.handleMessage(user, message as GameRequest);
      break;
    }
  }

  public run() {
    this.ws.on('request', (req: ws.request) => {
      let newConn: ws.connection;
      try {
        newConn = req.accept('echo-protocol', req.origin);
      } catch (e) {
        console.log(e);
        return;
      }
    
      const userId: string = makeId();
      
      const user: User = { conn: newConn, name: 'Anonymous', userId };
      this.users.push(user);
      newConn.sendUTF('connected');
      this.sendMessage(newConn, ResponseTypes.User, { id: user.userId, name: user.name });
      this.GameList.sendGameListToConnectedUser(user, this.GameRouter.games);
      newConn.on('message', (message: ws.Message) => {
        const parsedMessage: Request|null = this.parseMessage(message);
        if (!parsedMessage || !this.isMessageStructValid(parsedMessage)) {
          this.sendMessage(newConn, ErrorTypes.BAD_REQUEST, 'Message is invalid');
        }
        try {
          this.handleMessage(user, parsedMessage);
        } catch (e: unknown) {
          if (e instanceof BaseError) {
            this.sendMessage(newConn, e.type, e.message);
          } else {
            this.sendMessage(newConn, 'SERVER_ERR', {});
          }
        }
      });
    });
  }
}
