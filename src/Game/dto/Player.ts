import { ConnectedUser } from '../../ws';

export type Player = ConnectedUser & {
  side: 'w' | 'b';
  timeRemain: number;
  moveTurnStartDate?: Date;
  endGameTimer?: NodeJS.Timer;
};
