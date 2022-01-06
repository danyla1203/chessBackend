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
  byFigure: Figure;
}
export type PossibleShahes = {
  'w': Figure[];
  'b': Figure[];
}
export type Figures = {[index: Figure]: Cell};

type Boards = {
  board: Figures;
  enemyBoard: Figures;
}
type CellUpdate = {
  prevCell: Cell;
  newCell: Cell;
}
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
  private checkIsCellEmpty(boards: Boards, cell: string): boolean {
    if (parseInt(cell[1], 10) > 8) return false;
    for (let figure in boards.board) {
      if (boards.board[figure] === cell) return false;
    }
    for (let figure in boards.enemyBoard) {
      if (boards.enemyBoard[figure] === cell) return false;
    }
    return true;
  }
  private isEnemyInCell(board: Figures, cell: Cell): boolean {
    for (let figure in board) {
      if (board[figure] === cell) return true;
    }
    return false;
  }

  private canPawnMove(boards: Boards, cells: CellUpdate): boolean {
    let { newCell, prevCell } = cells
    let sideToMove;
    if (this.store.side == 'w') {
      sideToMove = 1;
    } else {
      sideToMove = -1;
    }
  
    let [ prevLetter, prevNum ] = prevCell;
    let nextLetters = this.findNextLetter(prevLetter);
    let possibleNextNum  = parseInt(prevNum) + sideToMove;
    let possibleMoves = [];

    let possibleNextCell = `${prevLetter}${possibleNextNum}`;
    let possibleNextDiagonalCell1 = `${nextLetters[0]}${possibleNextNum}`;
    let possibleNextDiagonalCell2 = `${nextLetters[1]}${possibleNextNum}`;

    if (possibleNextCell == newCell && this.checkIsCellEmpty(boards, newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell1 == newCell && this.isEnemyInCell(boards.enemyBoard, newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell2 == newCell && this.isEnemyInCell(boards.enemyBoard, newCell)) {
      possibleMoves.push(newCell);
    }
    for (let i = 0; i < possibleMoves.length; i++) {
      if (possibleMoves[i] == newCell) {
        return true;
      }
    }
    return false;
  }
  private canRockMove(boards: Boards, cells: CellUpdate): boolean {
    let { newCell, prevCell } = cells
    let [ prevLetter, num ] = prevCell;
    let prevNum = parseInt(num, 10);
    for (let i = prevNum + 1; i < 9; i++) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = prevNum - 1; i > 0; i--) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }

    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);
    for (let i = letterIndex + 1; i < this.Letters.length; i++) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
  }
  private canKnightMove(boards: Boards, cells: CellUpdate): boolean {
    let [prevLetter, prevNum] = cells.prevCell;
    let num = parseInt(prevNum, 10);
    let nextLetters = this.findNextLetter(prevLetter);
    let nextLetterRight = this.findNextLetter(nextLetters[1])[1];
    let nextLetterLeft = this.findNextLetter(nextLetters[0])[0];
    nextLetterLeft = nextLetterLeft == prevLetter ? null : nextLetterLeft;

    let possibleCells: Cell[] = [
      `${nextLetters[1]}${num + 2}`,
      `${nextLetterRight}${num + 1}`,
      `${nextLetterRight}${num - 1}`,
      `${nextLetters[1]}${num - 2}`,
      `${nextLetters[0]}${num - 2}`,
      `${nextLetterLeft}${num - 1}`,
      `${nextLetterLeft}${num + 1}`,
      `${nextLetters[0]}${num + 2}`
    ];
    for (let i = 0; i < possibleCells.length; i++)  {
      if (cells.newCell == possibleCells[i]) {
        return true;
      }
    }
  }
  private canBishopMove(boards: Boards, cells: CellUpdate): boolean {
    let { newCell, prevCell } = cells
    let [ prevLetter, num ] = prevCell;
    let prevNum = parseInt(num, 10);
    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);

    for (let i = letterIndex + 1, nextNum = prevNum + 1; i < this.Letters.length; i++, nextNum++) {
      if (nextNum > 8) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum - 1; i >= 0; i--, nextNum--) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex + 1, nextNum = prevNum - 1; i < this.Letters.length; i++, nextNum--) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum + 1; i >= 0; i--, nextNum++) {
      if (nextNum <= 0) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.enemyBoard, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
  }
  private canQueenMove(boards: Boards, cells: CellUpdate): boolean {
    let result = this.canBishopMove(boards, cells);
    return result || this.canRockMove(boards, cells);
  }
  public verifyFigureMove(board: Figures, enemyBoard: Figures, figure: Figure, cell: Cell): boolean {
    let boards: Boards = {
      board: board,
      enemyBoard: enemyBoard
    }
    let cells: CellUpdate = {
      prevCell: board[figure],
      newCell: cell
    }
    if (/pawn/.test(figure) && this.canPawnMove(boards, cells)) {
      return true;
    } else if (/R/.test(figure) && this.canRockMove(boards, cells)) {
      return true;
    } else if (/K/.test(figure) && this.canKnightMove(boards, cells)) {
      return true;
    } else if (/B/.test(figure) && this.canBishopMove(boards, cells)) {
      return true;
    } else if (/Q/.test(figure) && this.canQueenMove(boards, cells)) {
      return true;
    }
  }

  public possibleStrike(turnSide: 'w'|'b', cell: Cell): null|StrikedData {
    if (turnSide == 'w') {
      for (let figure in this.store.black) {
        if (this.store.black[figure] == cell) {
          return { strikedSide: 'b', figure: figure };
        }
      }
    } else {
      for (let figure in this.store.white) {
        if (this.store.white[figure] == cell) {
          return { strikedSide: 'w', figure: figure };
        }
      }
    }
  }

  public verifyIncomingData(side?: string, figure?: Figure, cell?: Cell): boolean {
    if (!side || !figure || !cell) return false
    if (this.store.side != side) return false;
    if (!this.store.white[figure] && !this.store.black[figure]) return false;
    return true;
  }

  public isShahRemainsAfterMove(side: string, figure: Figure, cell: Cell): boolean {
    if (!this.store.shah) return false;
    if (this.store.shah.shachedSide != side) return false;
    let strike: null|StrikedData = this.possibleStrike(side, cell);
    if (strike) {
      if (strike.figure == this.store.shah.byFigure) return false;
    }

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

    if (this.verifyFigureMove(opponentBoard, board, this.store.shah.byFigure, kingCell)) {
      return true;
    }
    return false;
  }
  public removeShah(): void {
    this.store.removeShah();
  }

  public setPossibleShahes(figure: Figure, cell: Cell): void { 
    let enemyKnCell: Cell = this.store.side == 'w' ?
      this.store.black['Kn']:
      this.store.white['Kn'];
    let opponentBoard: Figures = { 'Kn': enemyKnCell }
    let board: Figures = {}
    board[figure] = cell;
    if (this.verifyFigureMove(board, opponentBoard, figure, enemyKnCell)) {
      this.store.setPossibleShah(this.getOpponentSide(), figure);
    }
  }
  public checkPossibleShahes(): void {
    const figures =  this.store.getPossibleShahes()[this.store.side];
    const knCell = this.store.side == 'b' ?
      this.store.black['Kn']:
      this.store.white['Kn'];
    let board: Figures = {};
    let opponentBoard: Figures = {'Kn': knCell};
     
    for (let i = 0; i < figures.length; i++) {
      this.store.side == 'b' ?
        board[figures[i]] = this.store.white[figures[i]]:
        board[figures[i]] = this.store.black[figures[i]];
      if (!board[figures[i]]) continue;
      if (!this.verifyFigureMove(board, opponentBoard, figures[i], knCell)) {
        figures.splice(i, 1);
      }
      board = {};
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
  public removeFigure(turnSide: 'w'|'b', figure: Figure): void {
    turnSide == 'w' ? 
      this.store.removeFigure('b', figure) :
      this.store.removeFigure('w', figure);
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
