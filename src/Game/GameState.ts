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
    this.possibleShahes = { 'w': new Set(), 'b': new Set() };
    this.strikeAroundKn = { 'w': new Set(), 'b': new Set() };
  }

  public updateBoard(figure: Figure, cell: Cell): void {
    this.sideToTurn == 'w' ?
      this.whiteBoard[figure] = cell:
      this.blackBoard[figure] = cell;
  }
  
  public removeShah(): void {
    this.shahData = null;
  }

  public getBlack(): Figures {
    return Object.assign({}, this.blackBoard);
  }
  public getWhite(): Figures {
    return Object.assign({}, this.whiteBoard);
  }
  get state() {
    return {'w': this.getWhite(), 'b': this.getBlack()}
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
    this.possibleShahes[side].add(figure);
  }
  public setStrikeAroundKn(side: 'w'|'b', figure: Figure): void {
    this.strikeAroundKn[side].add(figure);
  }
  public removeFigure(side: 'w'|'b', figure: Figure): void {
    if (side == 'w') {
      delete this.whiteBoard[figure];
      this.possibleShahes['b'].delete(figure);
      this.strikeAroundKn['b'].delete(figure);
    } else {
      delete this.blackBoard[figure];
      this.possibleShahes['w'].delete(figure);
      this.strikeAroundKn['w'].delete(figure);
    }
  }
}