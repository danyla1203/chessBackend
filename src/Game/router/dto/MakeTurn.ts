import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Cell, Figure } from '../../game/process/types';

export class Turn {
  @IsString()
  figure: Figure;

  @IsString()
  cell: Cell;
}

export class MakeTurnBody {
  @IsNumber()
  gameId: number;

  @ValidateNested()
  body: Turn;
}
