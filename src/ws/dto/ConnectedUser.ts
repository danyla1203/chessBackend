import * as ws from 'websocket';
import { makeId } from '../../tools/createUniqueId';

export class ConnectedUser {
  id: number;
  name: string;
  conn: ws.connection;
  isOnline: boolean;
  isAuthorized: boolean;
  constructor(conn: ws.connection, isAuthorized: boolean, userData?: any) {
    this.conn = conn, 
    this.isAuthorized = isAuthorized;
    if (userData) {
      this.id = userData.id;
      this.name = userData.name;
    } else {
      this.id = makeId();
      this.name = 'Anonymous';
    }
  }
}
