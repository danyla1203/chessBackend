export type Cell = string;
export type Figure = string;
export type FiguresState = {
  blackFigures: {[index: Figure]: Cell};
  whiteFigures: {[index: Figure]: Cell};
}
export class GameProccess {
  blackFigures: {[index: Figure]: Cell};
  whiteFigures: {[index: Figure]: Cell};
  sideToTurn: 'w'|'b';

  private initBoard() {
    this.blackFigures = {
      'pawn1': 'a7',
      'pawn2': 'b7',
      'pawn3': 'c7',
      'pawn4': 'd7',
      'pawn5': 'e7',
      'pawn6': 'f7',
      'pawn7': 'g7',
      'pawn8': 'h7',
      'R1': 'a8',
      'B1': 'b8',
      'K1': 'c8',
      'Q': 'd8',
      'Kn': 'e8',
      'K2': 'f8',
      'B2': 'g8',
      'R2': 'h8'
    };
    this.whiteFigures = {
      'pawn1': 'a2',
      'pawn2': 'b2',
      'pawn3': 'c2',
      'pawn4': 'd2',
      'pawn5': 'e2',
      'pawn6': 'f2',
      'pawn7': 'g2',
      'pawn8': 'h2',
      'R1': 'a1',
      'B1': 'b1',
      'K1': 'c1',
      'Q': 'd1',
      'Kn': 'e1',
      'K2': 'f1',
      'B2': 'g1',
      'R2': 'h1'
    }
  }

  constructor() {
    this.initBoard();
    this.sideToTurn = 'w';
  }

  public makeTurn(figure: Figure, cell: Cell): void {
    
  }
  public state(): FiguresState {
    return {
      blackFigures: this.blackFigures,
      whiteFigures: this.whiteFigures,
    }
  }
}
