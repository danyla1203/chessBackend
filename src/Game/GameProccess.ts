export type Cell = string;
export type Figure = string;
export type FiguresState = {
  black: {[index: Figure]: Cell};
  white: {[index: Figure]: Cell};
}
export type StrikedData = {
  strikedSide: 'w'|'b';
  figure: Figure;
}
export type ShahData = {
  shachedSide: 'w'|'b';
  byFigures: Figure[];
}
export class GameProccess {
  private Letters: string[];
  private black: {[index: Figure]: Cell};
  private white: {[index: Figure]: Cell};
  private sideToTurn: 'w'|'b';
  private shahData: null|ShahData

  public setMoveSide() {
    this.sideToTurn = this.getOpponentSide();
  }

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
  private getOpponentSide(): 'w'|'b' {
    if (this.sideToTurn == 'w') return 'b';
    else return 'w';
      
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

  private canPawnMove(figure: Figure, newCell: Cell): boolean {
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
        return true;
      }
    }
    return false;
  }
  private canRockMove(figure: Figure, newCell: Cell): boolean {
    let prevFigureCell;
    this.sideToTurn == 'w' ?
      prevFigureCell = this.white[figure]:
      prevFigureCell = this.black[figure];
    let [ prevLetter, num ] = prevFigureCell;
    let prevNum = parseInt(num, 10);

    for (let i = prevNum + 1; i < 9; i++) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = prevNum - 1; i > 0; i--) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }

    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);
    for (let i = letterIndex + 1; i < this.Letters.length; i++) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
  }
  private canKnightMove(figure: Figure, cell: Cell): boolean {
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
        return true;
      }
    }
  }
  private canBishopMove(figure: Figure, newCell: Cell): boolean {
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
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum - 1; i >= 0; i--, nextNum--) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = letterIndex + 1, nextNum = prevNum - 1; i < this.Letters.length; i++, nextNum--) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum + 1; i >= 0; i--, nextNum++) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
  }
  private canQueenMove(figure: Figure, cell: Cell): boolean {
    let result = this.canBishopMove(figure, cell);
    return result || this.canRockMove(figure, cell);
  }

  public updateBoard(figure: Figure, cell: Cell): void {
    this.sideToTurn == 'w' ?
      this.white[figure] = cell:
      this.black[figure] = cell;
  }

  public possibleStrike(cell: Cell): null|StrikedData {
    if (this.sideToTurn == 'w') {
      for (let figure in this.black) {
        if (this.black[figure] == cell) {
          return { strikedSide: 'w', figure: figure };
        }
      }
    } else {
      for (let figure in this.white) {
        if (this.white[figure] == cell) {
          return { strikedSide: 'b', figure: figure };
        }
      }
    }
    return null;
  }

  public verifyFigureMove(side: string, figure?: Figure, cell?: Cell): boolean {
    if (this.sideToTurn != side) return false;
    if (!figure || !cell) return false;
    if (!this.white[figure] && !this.black[figure]) return false;
    if (/pawn/.test(figure) && this.canPawnMove(figure, cell)) {
      return true;
    } else if (/R/.test(figure) && this.canRockMove(figure, cell)) {
      return true;
    } else if (/K/.test(figure) && this.canKnightMove(figure, cell)) {
      return true;
    } else if (/B/.test(figure) && this.canBishopMove(figure, cell)) {
      return true;
    } else if (/Q/.test(figure) && this.canQueenMove(figure, cell)) {
      return true;
    }
  }
  public isShah(side: string, figure: Figure, cell: Cell): boolean {
    if (!this.shahData) return false;
    if (this.shahData.shachedSide != side) return false;
    let sideStateCopy, kingCell;
    if (this.sideToTurn == 'w') {
      sideStateCopy = Object.assign({}, this.white);
      kingCell = this.white['Kn'];
      this.white[figure] = cell;
    } else {
      sideStateCopy = Object.assign({}, this.black);
      kingCell = this.black['Kn'];
      this.black[figure] = cell;
    }
    let oponent = this.getOpponentSide();
    this.sideToTurn = oponent;
    for (let i = 0; i < this.shahData.byFigures.length; i++) {
      let byFigure = this.shahData.byFigures[i];
      if (this.verifyFigureMove(oponent, byFigure, kingCell)) {
        this.sideToTurn = this.getOpponentSide();
        return true;
      }
    }
    this.sideToTurn == 'w' ? 
      this.white = sideStateCopy :
      this.black = sideStateCopy;
    return false;

  }
  public setShah(movedFigure: Figure): null|ShahData {
    let kingCell: Cell = this.sideToTurn == 'w' ?
      this.black['Kn']:
      this.white['Kn'];
    if (this.verifyFigureMove(this.sideToTurn, movedFigure, kingCell)) {
      if (!this.shahData) {
        this.shahData = { 
          shachedSide: this.getOpponentSide(), 
          byFigures: [movedFigure] 
        }
      } else this.shahData.byFigures.push(movedFigure);
    }
    return this.shahData;
  }
  public removeFigure(figure: Figure): void {
    if (this.sideToTurn == 'w') {
      delete this.black[figure];
    } else if (this.sideToTurn == 'b') {
      delete this.white[figure];
    }
  }
  public state(): FiguresState {
    return {
      black: this.black,
      white: this.white,
    }
  }
}
