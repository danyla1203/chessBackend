import { Figures, ShahData, PossibleShahes, Figure, Cell, StrikeAround } from "./GameProccess";

export class GameState {
  private blackBoard: Figures;
  private whiteBoard: Figures;
  private shahData: null|ShahData;
  private possibleShahes: PossibleShahes;
  private strikeAroundKn: StrikeAround

  private sideToTurn: 'w'|'b';

  constructor(white: Figures, black: Figures) {
    this.blackBoard = black;
    this.whiteBoard = white;
    this.sideToTurn = 'w';
    this.possibleShahes = { 'w': [], 'b': [] };
    this.strikeAroundKn = { 'w': new Set(), 'b': new Set() };
  }

  public updateBoard(figure: Figure, cell: Cell): void {
    this.sideToTurn == 'w' ?
      this.white[figure] = cell:
      this.black[figure] = cell;
  }
  
  public removeShah(): void {
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
  public setShahData(toSide: 'w'|'b', byFigure: Figure): void {
    this.shahData = { 
      shachedSide: toSide,
      byFigure: byFigure
    }
  }
  public getPossibleShahes(): PossibleShahes {
    return this.possibleShahes;
  }
  public getStrikeAroundKn(): StrikeAround {
    return this.strikeAroundKn;
  }
  public setPossibleShah(side: 'w'|'b', figure: Figure): void {
    this.possibleShahes[side].push(figure);
  }
  public setStrikeAroundKn(side: 'w'|'b', figure: Figure): void {
    this.strikeAroundKn[side].add(figure);
  }
  public removeFigure(side: 'w'|'b', figure: Figure): void {
    side == 'w' ?
      delete this.whiteBoard[figure]:
      delete this.blackBoard[figure];
  }
}