export type Cell = string;
export type Figure = string;
export type FiguresState = {
  black: {[index: Figure]: Cell};
  white: {[index: Figure]: Cell};
}
export type StrikedData = {
  strikedSide: 'w'|'b';
  figure?: Figure
}
export class GameProccess {
  Letters: string[]
  black: {[index: Figure]: Cell};
  white: {[index: Figure]: Cell};
  sideToTurn: 'w'|'b';

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
      if (this.white[figure] === cell) return false;
    }
    for (let figure in this.black) {
      if (this.black[figure] === cell) return false;
    }
    return true;
  }
  private isEnemyInCell(cell: Cell): boolean {
    if (this.sideToTurn == 'w') {
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
    this.sideToTurn == 'w' ?
      this.white[figure] = cell:
      this.black[figure] = cell;
  }

  private strike(cell: Cell): Figure {
    if (this.sideToTurn == 'w') {
      for (let figure in this.black) {
        if (this.black[figure] == cell) {
          delete this.black[figure];
          return figure;
        }
      }
    } else {
      for (let figure in this.white) {
        if (this.white[figure] == cell) {
          console.log('strike');
          delete this.white[figure];
          return figure;
        }
      }
    }
  }

  private pawnMove(figure: Figure, newCell: Cell): Figure|null {
    let prevFigureCell, sideToMove;
    if (this.sideToTurn == 'w') {
      prevFigureCell = this.white[figure];
      sideToMove = 1;
    } else {
      prevFigureCell = this.black[figure];
      sideToMove = -1;
    }
  
    let [ prevLetter, prevNum ] = prevFigureCell;
    let nextLetters = this.findNextLetter(prevLetter);
    let possibleNextNum  = parseInt(prevNum) + sideToMove;
    let possibleMoves = [];

    let possibleNextCell = `${prevLetter}${possibleNextNum}`;
    let possibleNextDiagonalCell1 = `${nextLetters[0]}${possibleNextNum}`;
    let possibleNextDiagonalCell2 = `${nextLetters[1]}${possibleNextNum}`;
    if (possibleNextCell == newCell && this.checkIsCellEmpty(newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell1 == newCell && this.isEnemyInCell(newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell2 == newCell && this.isEnemyInCell(newCell)) {
      possibleMoves.push(newCell);
    }
    for (let i = 0; i < possibleMoves.length; i++) {
      if (possibleMoves[i] == newCell) {
        let striked = this.strike(newCell);
        this.updateBoard(figure, newCell);
        return striked;
      }
    }
  }
  private rockMove(figure: Figure, newCell: Cell): Figure|null {
    let prevFigureCell;
    this.sideToTurn == 'w' ?
      prevFigureCell = this.white[figure]:
      prevFigureCell = this.black[figure];
    let [ prevLetter, num ] = prevFigureCell;
    let prevNum = parseInt(num, 10);

    for (let i = prevNum + 1; i < 9; i++) {
      let cell = `${prevLetter}${i}`;
      if (!this.checkIsCellEmpty(cell)) break;
      else if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      } 
    }
    for (let i = prevNum - 1; i > 0; i--) {
      let cell = `${prevLetter}${i}`;
      if (!this.checkIsCellEmpty(cell)) break;
      else if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      } 
    }

    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);
    for (let i = letterIndex + 1; i < this.Letters.length; i++) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (!this.checkIsCellEmpty(cell)) break;
      else if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      } 
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (!this.checkIsCellEmpty(cell)) break;
      else if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      } 
    }
  }
  private knightMove(figure: Figure, cell: Cell): Figure|null {
    let prevFigureCell;
    if (this.sideToTurn == 'w') {
      prevFigureCell = this.white[figure];
    } else {
      prevFigureCell = this.black[figure];
    }
    let [prevLetter, prevNum] = prevFigureCell;
    let num = parseInt(prevNum, 10);
    let nextLetters = this.findNextLetter(prevLetter);
    let nextLetterRight = this.findNextLetter(nextLetters[1])[1];
    let nextLetterLeft = this.findNextLetter(nextLetters[0])[0];
    nextLetterLeft = nextLetterLeft == prevLetter ? null : nextLetterLeft;

    let cells: Cell[] = [
      `${nextLetters[1]}${num + 2}`,
      `${nextLetterRight}${num + 1}`,
      `${nextLetterRight}${num - 1}`,
      `${nextLetters[1]}${num - 2}`,
      `${nextLetters[0]}${num - 2}`,
      `${nextLetterLeft}${num - 1}`,
      `${nextLetterLeft}${num + 1}`,
      `${nextLetters[0]}${num + 2}`
    ];
    for (let i = 0; i < cells.length; i++)  {
      if (cell == cells[i]) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      }
    }
  }
  private bishopMove(figure: Figure, newCell: Cell): Figure|null {
    let prevFigureCell;
    this.sideToTurn == 'w' ?
      prevFigureCell = this.white[figure]:
      prevFigureCell = this.black[figure];
    let [ prevLetter, num ] = prevFigureCell;
    let prevNum = parseInt(num, 10);

    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);

    for (let i = letterIndex + 1, nextNum = prevNum + 1; i < this.Letters.length; i++, nextNum++) {
      if (nextNum > 8) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum - 1; i >= 0; i--, nextNum--) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      }
    }
    for (let i = letterIndex + 1, nextNum = prevNum - 1; i < this.Letters.length; i++, nextNum--) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum + 1; i >= 0; i--, nextNum++) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        this.updateBoard(figure, cell);
        return this.strike(cell);
      }
    }
  }
  private queenMove(figure: Figure, cell: Cell): Figure|null {
    let striked = this.bishopMove(figure, cell);
    if (striked) return striked;
    return this.rockMove(figure, cell);
  }

  public makeTurn(side: string, figure?: Figure, cell?: Cell): StrikedData|null {
    if (this.sideToTurn != side) return;
    if (!figure || !cell) return;
    if (!this.white[figure] && !this.black[figure]) return;

    let striked = null;

    if (/pawn/.test(figure)) striked = this.pawnMove(figure, cell);
    if (/R/.test(figure)) striked = this.rockMove(figure, cell);
    if (/K/.test(figure)) striked = this.knightMove(figure, cell);
    if (/B/.test(figure)) striked = this.bishopMove(figure, cell);
    if (/Q/.test(figure)) striked = this.queenMove(figure, cell);
    this.sideToTurn == 'w'  ?
      this.sideToTurn = 'b' : 
      this.sideToTurn = 'w';
    if (striked) return { strikedSide: this.sideToTurn, figure: striked };
  }

  public state(): FiguresState {
    return {
      black: this.black,
      white: this.white,
    }
  }
}
