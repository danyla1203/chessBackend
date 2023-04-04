type PlayerData = {
  id: string;
  name: string;
};
export type GameData = {
  id: number;
  spectators: number;
  players: PlayerData[];
  isActive: boolean;
  maxTime: number;
  timeIncrement: number;
  side: 'w' | 'b' | 'rand';
};
