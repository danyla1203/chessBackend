import { IsEnum, IsNumber } from 'class-validator';

enum SidePick {
  'rand' = 'rand',
  'w' = 'w',
  'b' = 'b',
}
export class GameConfig {
  @IsEnum(SidePick)
  side: SidePick;

  @IsNumber()
  time: number;

  @IsNumber()
  timeIncrement: number;
}
