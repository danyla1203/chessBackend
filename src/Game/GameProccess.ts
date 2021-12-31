import { GameState } from "./GameState";

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
export type PossibleShahes = {
  'w': Figure[],
  'b': Figure[]
}
export type Figures = {[index: Figure]: Cell};
export class GameProccess {
  private Letters: string[];
  private store: GameState;

  public setMoveSide() {
    this.store.turnSide = this.getOpponentSide();
  }

  private initBoard(): any {
    const black = {
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
    const white = {
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
    return {white: white, black: black}

  }
  private getOpponentSide(): 'w'|'b' {
    if (this.store.side == 'w') return 'b';
    else return 'w';
      
  }
  constructor() {
    const { white, black } = this.initBoard();
    this.store = new GameState(white, black);
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
    for (let figure in this.store.white) {
      if (this.store.white[figure] === cell) return false;
    }
    for (let figure in this.store.black) {
      if (this.store.black[figure] === cell) return false;
    }
    return true;
  }
  private isEnemyInCell(board: Figures, cell: Cell): boolean {
    for (let figure in board) {
      if (board[figure] === cell) return true;
    }
    return false;
  }

  private canPawnMove
  (
    enemyBoard: Figures,
    prevFigureCell: Cell, 
    newCell: Cell
  ): boolean {
    let sideToMove;
    if (this.store.side == 'w') {
      sideToMove = 1;
    } else {
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
    if (possibleNextDiagonalCell1 == newCell && this.isEnemyInCell(enemyBoard, newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell2 == newCell && this.isEnemyInCell(enemyBoard, newCell)) {
      possibleMoves.push(newCell);
    }
    for (let i = 0; i < possibleMoves.length; i++) {
      if (possibleMoves[i] == newCell) {
        return true;
      }
    }
    return false;
  }
  private canRockMove(enemyBoard: Figures, prevFigureCell: Cell, newCell: Cell): boolean {
    let [ prevLetter, num ] = prevFigureCell;
    let prevNum = parseInt(num, 10);

    for (let i = prevNum + 1; i < 9; i++) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = prevNum - 1; i > 0; i--) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
  }
  private canKnightMove(prevFigureCell: Cell, cell: Cell): boolean {
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
  private canBishopMove(enemyBoard: Figures, prevFigureCell: Cell, newCell: Cell): boolean {
    let [ prevLetter, num ] = prevFigureCell;
    let prevNum = parseInt(num, 10);
    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);

    for (let i = letterIndex + 1, nextNum = prevNum + 1; i < this.Letters.length; i++, nextNum++) {
      if (nextNum > 8) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(cell)) {
        break;
      }
    }
  }
  private canQueenMove(board: Figures, prevFigureCell: Cell, cell: Cell): boolean {
    let result = this.canBishopMove(board, prevFigureCell, cell);
    return result || this.canRockMove(board, prevFigureCell, cell);
  }
  public verifyFigureMove(board: Figures, enemyBoard: Figures, figure?: Figure, cell?: Cell): boolean {
    let prevFigureCell = board[figure];
    if (/pawn/.test(figure) && this.canPawnMove(enemyBoard, prevFigureCell, cell)) {
      return true;
    } else if (/R/.test(figure) && this.canRockMove(enemyBoard, prevFigureCell, cell)) {
      return true;
    } else if (/K/.test(figure) && this.canKnightMove(prevFigureCell, cell)) {
      return true;
    } else if (/B/.test(figure) && this.canBishopMove(enemyBoard, prevFigureCell, cell)) {
      return true;
    } else if (/Q/.test(figure) && this.canQueenMove(enemyBoard, prevFigureCell, cell)) {
      return true;
    }
  }

  public possibleStrike(cell: Cell): null|StrikedData {
    if (this.store.side == 'w') {
      for (let figure in this.store.black) {
        if (this.store.black[figure] == cell) {
          return { strikedSide: 'w', figure: figure };
        }
      }
    } else {
      for (let figure in this.store.white) {
        if (this.store.white[figure] == cell) {
          return { strikedSide: 'b', figure: figure };
        }
      }
    }
    return null;
  }

  public verifyIncomingData(side?: string, figure?: Figure, cell?: Cell): boolean {
    if (!side || !figure || !cell) return false
    if (this.store.side != side) return false;
    if (!this.store.white[figure] && !this.store.black[figure]) return false;
  }

  public isShahRemainsAfterMove(side: string, figure: Figure, cell: Cell): boolean {
    if (!this.store.shah) return false;
    if (this.store.shah.shachedSide != side) return false;

    let kingCell, board, opponentBoard;
    if (this.store.side == 'w') {
      board =  Object.assign({}, this.store.white);
      opponentBoard =  Object.assign({}, this.store.black);
      kingCell = this.store.white['Kn'];
    } else {
      board =  Object.assign({}, this.store.black);
      opponentBoard =  Object.assign({}, this.store.white);
      kingCell = this.store.black['Kn'];
    }
    board[figure] = cell;

    for (let i = 0; i < this.store.shah.byFigures.length; i++) {
      let byFigure = this.store.shah.byFigures[i];
      if (this.verifyFigureMove(board, opponentBoard, byFigure, kingCell)) {
        this.store.turnSide = this.getOpponentSide();
        return true;
      }
    };

    this.store.removeShah();
    return false;
  }
  public setPossibleShahes(figure: Figure, cell: Cell): void { 
    let enemyKnCell: Cell = this.store.side == 'w' ? this.store.black['Kn']:this.store.white['Kn'];
    let opponentBoard: Figures = { 'Kn': enemyKnCell }
    let board: Figures = {}
    board[figure] = cell;
    
    if (this.verifyFigureMove(board, opponentBoard, figure, enemyKnCell)) {
      this.store.setPossibleSide(this.getOpponentSide(), figure);
    }
  }
  public checkPossibleShahes(): void {
    const figures =  this.store.getPossibleShahes()[this.store.side];
    const knCell = this.store.side == 'b' ?
      this.store.black['Kn'] : this.store.white['Kn'];
    let board = {'Kn': knCell};
    let opponentBoard: Figures = {};
    
    for (let i = 0; i < figures.length; i++) {
      this.store.side == 'b' ?
        opponentBoard[figures[i]] = this.store.white[figures[i]]:
        opponentBoard[figures[i]] = this.store.black[figures[i]];
      if (!this.verifyFigureMove(board, opponentBoard, figures[i], knCell)) {
        figures.splice(i, 1);
      }
      opponentBoard = {};
    }
  }

  public setShah(movedFigure: Figure): null|ShahData {
    let knCell, board, opponentBoard;
    if (this.store.side == 'w') {
      knCell = this.store.black['Kn'];
      board = this.store.white;
      opponentBoard = this.store.black;
    } else {
      knCell = this.store.white['Kn'];
      board = this.store.black;
      opponentBoard = this.store.white;
    }
    if (this.verifyFigureMove(board, opponentBoard, movedFigure, knCell)) {
      this.store.setShahData(this.getOpponentSide(), movedFigure);
    }
    return this.store.shah;
  }
  public removeFigure(figure: Figure): void {
    if (this.store.side == 'w') {
      delete this.store.black[figure];
    } else if (this.store.side == 'b') {
      delete this.store.white[figure];
    }
  }
  public state(): FiguresState {
    return {
      white: this.store.white,
      black: this.store.black,
    }
  }
  public updateBoard(figure: Figure, cell: Cell): void {
    this.store.updateBoard(figure, cell);
  }
}
