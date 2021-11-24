type Cell = string;
type Figure = string;

type TurnData = {
  figure: Figure;
  cell: Cell;
}

export class Game {
  couple: string[];
  path: string;

  static isNewGame(path: string, games: Game[]) {
    for (let i = 0; i < games.length; i++) {
      if (games[i].path == path) return false;
    }
    return true;
  }
  static findGame(path: string, userIp: string, games: Game[]) {
    return games.find((game) => {
      return game.path == path &&
             game.couple[0] !== userIp &&
             game.couple.length < 2;
    });
  }

  constructor(path: string, ip: string) {
    this.couple = [ip];
    this.path = path;
  }
  
  public addPlayer(ip: string) {
    this.couple.push(ip);
  }
  public start() {
    console.log("Game Start!", this);
  }
  public makeTurn(turn: TurnData) {

  }
}
