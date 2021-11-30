export type Cell = string;
export type Figure = string;
export type FiguresState = {
  black: {[index: Figure]: Cell};
  white: {[index: Figure]: Cell};
}
export class GameProccess {
  Letters: string[]
  black: {[index: Figure]: Cell};
  white: {[index: Figure]: Cell};
  sideToTurn: 'w'|'b';
  playingSide: 'w'|'b'

  private initBoard() {
    this.black = {
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
    this.white = {
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
    this.playingSide = 'w';
    this.Letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  }
  private findNextLetter(letter: string): string[] {
    let result = [];
    for (let i = 0; i < this.Letters.length; i++) {
      if (this.Letters[i] == letter) {
        if (this.Letters[i - 1]) {
          result.push(this.Letters[i - 1]);
        } else { result.push(null) }
        if (this.Letters[i + 1]) {
          result.push(this.Letters[i + 1]);
        } else { result.push(null) }
      }
    }
    return result;
  }
  private checkIsCellEmpty(cell: string): boolean {
    if (parseInt(cell[1], 10) > 8) return false;
    for (let figure in this.white) {
      console.log(this.white[figure], figure, cell);
      if (this.white[figure] === cell) return false;
    }
    for (let figure in this.black) {
      if (this.black[figure] === cell) return false;
    }
    return true;
  }
  private isEnemyInCell(cell: Cell): boolean {
    if (this.playingSide == 'w') {
      for (let figure in this.black) {
        if (this.black[figure] === cell) return true;
      }
    } else {
      for (let figure in this.white) {
        if (this.white[figure] === cell) return true;
      }
    }
  }

  private updateBoard(figure: Figure, cell: Cell): void {
    this.playingSide == 'w' ?
      this.white[figure] = cell:
      this.black[figure] = cell;
  }

  private pawnMove(figure: Figure, cell: Cell): void {
    let prevFigure, sideToMove;
    let [ letter, num ] = cell;
    if (this.playingSide == 'w') {
      prevFigure = this.white[figure];
      sideToMove = 1;
    } else {
      prevFigure = this.black[figure];
      sideToMove = -1;
    }

    let nextLetters = this.findNextLetter(letter);
    let nextNum = num + sideToMove;
    let possibleMoves = [];
    if (this.checkIsCellEmpty(`${letter}${nextNum}`)) {
      possibleMoves.push(`${letter}${nextNum}`);
    }
    if (this.isEnemyInCell(`${nextLetters[0]}${nextNum}`)) {
      possibleMoves.push(`${nextLetters[0]}${nextNum}`);
    }
    if (this.isEnemyInCell(`${nextLetters[1]}${nextNum}`)) {
      possibleMoves.push(`${nextLetters[1]}${nextNum}`);
    }
    possibleMoves.map((move: Cell) => {
      move == cell ? this.updateBoard(figure, cell) : null;
    });
  }
  private rockMove(cell: Cell) {}
  private knightMove(cell: Cell) {}
  private bishopMove(cell: Cell) {}
  private queenMove(cell: Cell) {}

  public makeTurn(side: string, figure?: Figure, cell?: Cell): void {
    if (this.sideToTurn != side) return;
    if (!figure || !cell) return;
    if (!this.white[figure] && !this.black[figure]) return;

    if (/pawn/.test(figure)) this.pawnMove(figure, cell);
    if (/R/.test(figure)) this.rockMove(cell);
    if (/K/.test(figure)) this.knightMove(cell);
    if (/B/.test(figure)) this.bishopMove(cell);
    if (/Q/.test(figure)) this.queenMove(cell);
  }

  public state(): FiguresState {
    return {
      black: this.black,
      white: this.white,
    }
  }
}
