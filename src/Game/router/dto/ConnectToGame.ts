import { IsNumber } from 'class-validator';

export class ConnectToGame {
  @IsNumber()
  gameId: number;
}
