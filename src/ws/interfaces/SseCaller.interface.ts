import { ConnectedUser } from '../dto/ConnectedUser';

export interface SSECaller {
  init: (
    sendMessage: (user: ConnectedUser, type: any, payload: any) => void,
    sendBroadcastMessage: (type: any, data: any[]) => void,
  ) => void;
  sendBroadcastMessage: (type: any, data: any) => void;
  sendMessage: (user: ConnectedUser, type: any, payload: any) => void;
  onRequest: (user: ConnectedUser) => any;
  onCloseConn: (user: ConnectedUser) => void;
}
