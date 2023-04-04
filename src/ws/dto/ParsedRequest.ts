import { IsObject, IsString } from 'class-validator';

export class ParsedRequest {
  @IsString()
  action: string;

  @IsObject()
  body: any;
}
