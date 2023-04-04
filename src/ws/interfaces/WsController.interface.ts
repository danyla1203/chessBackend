import { ConnectedUser } from '..';

export interface WSController {
  init: (
    sendMessage: (user: ConnectedUser, type: string, payload: any) => void,
  ) => void;
}
