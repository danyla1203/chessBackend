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
export type MateData = {
  matedSide: 'w'|'b',
  byFigure: Figure
}
export type PossibleShahes = {
  'w': Set<Figure>;
  'b': Set<Figure>;
}
export type StrikeAround = {
  'w': Set<Figure>;
  'b': Set<Figure>;
};
export type Figures = {[index: Figure]: Cell};

export type Boards = {
  board: Figures;
  opponent: Figures;
}
type CellUpdate = {
  prevCell: Cell;
  newCell: Cell;
}
export class GameProccess {
  private Letters: string[];
  private store: GameState;

  public setMoveSide(): void {
    this.store.turnSide = this.getOpponentSide();
  }

  private initBoard(): FiguresState {
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
      'B1': 'c8',
      'K1': 'b8',
      'Q': 'd8',
      'Kn': 'e8',
      'K2': 'g8',
      'B2': 'f8',
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
      'B1': 'c1',
      'K1': 'b1',
      'Q': 'd1',
      'Kn': 'e1',
      'K2': 'g1',
      'B2': 'f1',
      'R2': 'h1'
    }
    return {white: white, black: black}

  }
  private getOpponentSide(): 'w'|'b' {
    return this.store.side == 'w' ? 'b':'w';
  }
  private getCellsAround(cell: Cell): Cell[] {
    let [letter, number] = cell;
    let [leftLetter, rightLetter] = this.findNextLetter(letter);
    let nextNum = parseInt(number, 10) + 1;
    let prevNum = parseInt(number, 10) - 1;
    let result: Cell[] = [
      `${letter}${nextNum}`,
      `${letter}${prevNum}`,
      `${rightLetter}${nextNum}`,
      `${rightLetter}${prevNum}`,
      `${leftLetter}${nextNum}`,
      `${leftLetter}${prevNum}`,
      `${leftLetter}${number}`,
      `${rightLetter}${number}`
    ];
    for (let i = 0; i < result.length; i++) {
      let [lett, num] = result[i];
      if (parseInt(num) > 8 || parseInt(num) < 1 || result[i].length > 2) {
        result.splice(i, 1);
      }
    }
    return result;
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
    for (let figure in boards.opponent) {
      if (boards.opponent[figure] === cell) return false;
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
  
    let [ prevLetter, prevNumber ] = prevCell;
    let prevNum = parseInt(prevNumber, 10);
    let nextLetters = this.findNextLetter(prevLetter);
    let possibleNextNum  = prevNum + sideToMove;
    let possibleMoves = [];

    let possibleNextCell = `${prevLetter}${possibleNextNum}`;
    let possibleNextDiagonalCell1 = `${nextLetters[0]}${possibleNextNum}`;
    let possibleNextDiagonalCell2 = `${nextLetters[1]}${possibleNextNum}`;

    if (possibleNextCell == newCell && this.checkIsCellEmpty(boards, newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell1 == newCell && this.isEnemyInCell(boards.opponent, newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell2 == newCell && this.isEnemyInCell(boards.opponent, newCell)) {
      possibleMoves.push(newCell);
    }
    if (this.store.side == 'w' && prevNum == 2) {
      possibleMoves.push(`${prevLetter}${prevNum + 2}`);
    } else if (this.store.side == 'b' && prevNum == 7) {
      possibleMoves.push(`${prevLetter}${prevNum - 2}`);
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
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = prevNum - 1; i > 0; i--) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent, cell) && cell == newCell) {
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
  private canKnMove(boards: Boards, cells: CellUpdate): boolean {
    let possibleMoves = this.getEmptyCellsAroundKn(boards.board, cells.prevCell);
    for (let i = 0; i < possibleMoves.length; i++) {
      if (possibleMoves[i] == cells.newCell) {
        return true;
      }
    }
    return false;
  }
  public verifyFigureMove(board: Figures, enemyBoard: Figures, figure: Figure, cell: Cell): boolean {
    let boards: Boards = {
      board: board,
      opponent: enemyBoard
    }
    let cells: CellUpdate = {
      prevCell: board[figure],
      newCell: cell
    }
    if (/pawn/.test(figure) && this.canPawnMove(boards, cells)) {
      return true;
    } else if (/R/.test(figure) && this.canRockMove(boards, cells)) {
      return true;
    } else if (/Kn/.test(figure) && this.canKnMove(boards, cells)) {
      return true;
    } else if (/B/.test(figure) && this.canBishopMove(boards, cells)) {
      return true;
    } else if (/Q/.test(figure) && this.canQueenMove(boards, cells)) {
      return true;
    } else if (/K/.test(figure) && this.canKnightMove(boards, cells)) {
      return true;
    }
  }
  public isStrikeAfterMove(cell: Cell): null|StrikedData {
    let { board, opponent } = this.getBoards(); 
    for (let figure in opponent) {
      if (opponent[figure] == cell) {
        return { strikedSide: this.getOpponentSide(), figure: figure };
      }
    }
  }
  public isIncomingDataValid(side?: 'w'|'b', figure?: Figure, cell?: Cell): boolean {
    if (!side || !figure || !cell) return false;
    if (this.store.side != side) return false;
    if (!this.store.getWhite()[figure] && !this.store.getBlack()[figure]) return false;
    return true;
  }
  public isShahAppearsAfterMove
  (
    board: Figures, 
    opponent: Figures,
    figure: Figure, 
    cell: Cell
  ): boolean {
    let possibleShahes = this.store.getPossibleShahes();
    let knCell, shahes;
    if (this.store.side == 'w') {
      knCell = this.store.getWhite()['Kn'];
      shahes = possibleShahes['w'];
    } else {
      knCell = this.store.getBlack()['Kn'];
      shahes = possibleShahes['b'];
    }
    let strike: null|StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (shahes.has(strike.figure)) return false;
    }
    board[figure] = cell;
    for (let figure of shahes) {
      if (this.verifyFigureMove(opponent, board, figure, knCell)) {
        return true;
      }
    }
    return false;
  }
  public isShahRemainsAfterMove
  (
    board: Figures, 
    opponent: Figures, 
    figure: Figure, 
    cell: Cell
  ): boolean {
    if (!this.store.shah) return false;
    if (this.store.shah.shachedSide != this.store.side) return false;
    let strike: null|StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (strike.figure == this.store.shah.byFigure) return false;
    }

    board[figure] = cell;
    let knCell;
    this.store.side == 'w' ?
      knCell = this.store.getWhite()['Kn']:
      knCell = this.store.getBlack()['Kn'];
    if (this.verifyFigureMove(opponent, board, this.store.shah.byFigure, knCell)) {
      return true;
    }
    return false;
  }

  public removeShah(): void {
    this.store.removeShah();
  }
  private getEmptyCellsAroundKn(board: Figures, knCell: Cell): Cell[] {
    let result: Cell[] = [];
    this.getCellsAround(knCell).map((cell: Cell) => {
      if (this.checkIsCellEmpty({board: board, opponent: board}, cell)) {
        result.push(cell);
      }
    })
    return result;
  }

  public setPossibleShahes(figure: Figure, cell: Cell): void { 
    let enemyKnCell: Cell = this.store.side == 'w' ?
      this.store.getBlack()['Kn']:
      this.store.getWhite()['Kn'];
    let opponentBoard: Figures = { 'Kn': enemyKnCell }
    let board: Figures = {}
    board[figure] = cell;
    if (this.verifyFigureMove(board, opponentBoard, figure, enemyKnCell)) {
      this.store.setPossibleShah(this.getOpponentSide(), figure);
    }
  }
  public setFiguresAroundKn(board: Figures, opponent: Figures, figure: Figure) {
    let possibleKnMoves = this.store.side == 'w'?
      this.getEmptyCellsAroundKn(this.store.getBlack(), this.store.getBlack()['Kn']):
      this.getEmptyCellsAroundKn(this.store.getWhite(), this.store.getWhite()['Kn']);
    possibleKnMoves.map((cell: Cell) => {
      if (this.verifyFigureMove(board, opponent, figure, cell)) {
        this.store.setStrikeAroundKn(this.getOpponentSide(), figure);
      }
    });
  }
  public checkFiguresAroundKn(board: Figures, opponent: Figures) {
    let figures = this.store.getStrikeAroundKn()[this.getOpponentSide()];
    let knCell = opponent['Kn'];
    let possibleKnMoves = this.getEmptyCellsAroundKn(opponent, knCell);

    for (let figure of figures) {
      let canMove = false;
      for (let j = 0; j < possibleKnMoves.length; j++) {
        if (this.verifyFigureMove(board, opponent, figure, possibleKnMoves[j])) {
          canMove = true;
          break;
        }
      }
      if (!canMove) {
        figures.delete(figure)
      }
    }
  }
  public checkPossibleShahes(): void {
    const figures =  this.store.getPossibleShahes()[this.store.side];
    const knCell = this.store.side == 'b' ?
      this.store.getBlack()['Kn']:
      this.store.getWhite()['Kn'];
    let board: Figures = {};
    let opponent: Figures = {'Kn': knCell};
    for (let figure of figures) {
      this.store.side == 'b' ?
        board[figure] = this.store.getWhite()[figure]:
        board[figure] = this.store.getBlack()[figure];
      if (!board[figure]) continue;
      if (!this.verifyFigureMove(board, opponent, figure, knCell)) {
        figures.delete(figure)
      }
      board = {};
    }
  }

  public setShah(movedFigure: Figure): null|ShahData {
    let knCell, board, opponentBoard;
    if (this.store.side == 'w') {
      knCell = this.store.getBlack()['Kn'];
      board = this.store.getWhite();
      opponentBoard = this.store.getBlack();
    } else {
      knCell = this.store.getWhite()['Kn'];
      board = this.store.getBlack();
      opponentBoard = this.store.getWhite();
    }
    if (this.verifyFigureMove(board, opponentBoard, movedFigure, knCell)) {
      this.store.setShahData(this.getOpponentSide(), movedFigure);
    }
    return this.store.shah;
  }
  public setMate(movedFigure: Figure, cell: Cell): null|MateData {
    if (!this.store.shah) return null;

    let enemyKnCell, board, opponentBoard;
    if (this.store.side == 'w') {
      enemyKnCell = this.store.getBlack()['Kn'];
      board = this.store.getWhite();
      opponentBoard = this.store.getBlack();
    } else {
      enemyKnCell = this.store.getWhite()['Kn'];
      board = this.store.getBlack();
      opponentBoard = this.store.getWhite();
    }

    for (let opFigure in opponentBoard) {
      if (opFigure == 'Kn') continue;
      if (this.verifyFigureMove(opponentBoard, board, opFigure, cell)) {
        return null;
      }
    }

    let emptyCells: Cell[] = this.getEmptyCellsAroundKn(opponentBoard, enemyKnCell);
    let figuresAroundKn = this.store.getStrikeAroundKn()[this.getOpponentSide()];
    let canKnMoveCells: Cell[] = [];
    for (let i = 0; i < emptyCells.length; i++) {
      let isStrike = false;
      for (let figure of figuresAroundKn) {
        if (this.verifyFigureMove(board, opponentBoard, figure, board[figure])) {
          isStrike = true;
          break;
        }
      }
      if (!isStrike) {
        canKnMoveCells.push(emptyCells[i]);
      }
    }
    if (canKnMoveCells.length == 0) {
      return {
        matedSide: this.getOpponentSide(),
        byFigure: movedFigure
      }
    } else {
      for (let i = 0; i < canKnMoveCells.length; i++) {
        if (this.verifyFigureMove(board, opponentBoard, movedFigure, canKnMoveCells[i])) {
          return {
            matedSide: this.getOpponentSide(),
            byFigure: movedFigure
          }
        }
      }
      return null;
    }
  }
  public removeFigure(turnSide: 'w'|'b', figure: Figure): void {
    turnSide == 'w' ? 
      this.store.removeFigure('b', figure) :
      this.store.removeFigure('w', figure);
  }
  public state(): FiguresState {
    return {
      white: this.store.getWhite(),
      black: this.store.getBlack(),
    }
  }
  public getSide(): 'w'|'b' {
    return this.store.side;
  }
  public getBoards(): Boards {
    let side = this.store.side;
    let state = this.store.state;
    let board, opponent;
    if (side == 'w') { 
      board = state.w; 
      opponent = state.b 
    } else { 
      board = state.b; 
      opponent = state.w 
    }
    return { board, opponent };
  }
  public updateBoard(figure: Figure, cell: Cell): void {
    this.store.updateBoard(figure, cell);
  }
}
