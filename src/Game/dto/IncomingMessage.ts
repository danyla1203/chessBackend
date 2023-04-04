import { IsNumber, IsString } from 'class-validator';

export class GameChatIncomingMessage {
  @IsString()
  text: string;

  @IsNumber()
  gameId: number;
}
