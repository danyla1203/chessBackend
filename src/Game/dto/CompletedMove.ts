import {
  MateData, 
  ShahData, 
  StrikedData 
} from '../game/process/types';

export type CompletedMove = {
  mate?: null | MateData;
  shah?: null | ShahData;
  strikedData?: null | StrikedData;
};
