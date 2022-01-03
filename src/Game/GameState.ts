import { Figures, ShahData, PossibleShahes, Figure, Cell } from "./GameProccess";

export class GameState {
  private blackBoard: Figures;
  private whiteBoard: Figures;
  private shahData: null|ShahData;
  private possibleShahes: null|PossibleShahes;

  private sideToTurn: 'w'|'b';

  constructor(white: Figures, black: Figures) {
    this.blackBoard = black;
    this.whiteBoard = white;
    this.sideToTurn = 'w';
    this.possibleShahes = { 'w': [], 'b': [] };
  }

  public updateBoard(figure: Figure, cell: Cell): void {
    this.sideToTurn == 'w' ?
      this.white[figure] = cell:
      this.black[figure] = cell;
  }
  public deleteFigure(side: 'w'|'b', figure: Figure): void {
    this.sideToTurn == 'w' ?
      delete this.white[figure]:
      delete this.black[figure]
  } 
  public removeShah() {
    this.shahData = null;
  }

  get black() {
    return this.blackBoard;
  }
  get white() {
    return this.whiteBoard;
  }
  get state() {
    return {'w': this.white, 'b': this.black}
  }
  get side() {
    return this.sideToTurn;
  }
  set turnSide(side: 'w'|'b') {
    this.sideToTurn = side;
  }
  get shah() {
    return this.shahData;
  }
  public setShahData(toSide: 'w'|'b', byFigure: Figure) {
    if (this.shahData && this.shahData.byFigures.length >= 1) {
      this.shahData.byFigures.push(byFigure);
    } else {
      this.shahData = { 
        shachedSide: toSide,
        byFigures: [byFigure]
      }
    }
  }
  public getPossibleShahes(): PossibleShahes {
    return this.possibleShahes;
  }
  public setPossibleShah(side: 'w'|'b', figure: Figure) {
    this.possibleShahes[side].push(figure);
  }
  public removeFigure(side: 'w'|'b', figure: Figure): void {
    if (side == 'w') {
      delete this.black[figure];
    } else if (this.side == 'b') {
      delete this.white[figure];
    }
  }
}