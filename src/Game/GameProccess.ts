import { GameState } from './GameState';

export type Cell = string;
export type Figure = string;
export type FiguresState = {
  black: Map<Figure, Cell>
  white: Map<Figure, Cell>
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
export type Figures = Map<Figure, Cell>

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
    };
    return {
      white: new Map(Object.entries(white)), 
      black: new Map(Object.entries(black))
    };
  }
  private getCellsAround(cell: Cell): Cell[] {
    let [ letter, number ] = cell;
    let [ leftLetter, rightLetter ] = this.findNextLetter(letter);
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
      const num = result[1];
      if (parseInt(num) > 8 || parseInt(num) < 1 || result[i].length > 2) {
        result.splice(i, 1);
      }
    }
    return result;
  }
  constructor() {
    const { white, black } = this.initBoard();
    this.store = new GameState(white, black);
    this.Letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];
  }
  private findNextLetter(letter: string): string[] {
    let result = [];
    for (let i = 0; i < this.Letters.length; i++) {
      if (this.Letters[i] == letter) {
        if (this.Letters[i - 1]) {
          result.push(this.Letters[i - 1]);
        } else { result.push(null); }
        if (this.Letters[i + 1]) {
          result.push(this.Letters[i + 1]);
        } else { result.push(null); }
      }
    }
    return result;
  }
  private checkIsCellEmpty(boards: Boards, cell: string): boolean {
    if (parseInt(cell[1], 10) > 8) return false;
    for (let [ figure, cell ] of boards.board) {
      if (boards.board.get(figure) === cell) return false;
    }
    for (let [ figure, cell ] of boards.opponent) {
      if (boards.opponent.get(figure) === cell) return false;
    }
    return true;
  }
  private isEnemyInCell(board: Figures): boolean {
    for (const [ figure, cell ] of board) {
      if (board.get(figure) === cell) return true;
    }
    return false;
  }
  private canPawnMove(boards: Boards, cells: CellUpdate): boolean {
    let { newCell, prevCell } = cells;
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
    if (possibleNextDiagonalCell1 == newCell && this.isEnemyInCell(boards.opponent)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell2 == newCell && this.isEnemyInCell(boards.opponent)) {
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
    let { newCell, prevCell } = cells;
    let [ prevLetter, num ] = prevCell;
    let prevNum = parseInt(num, 10);
    for (let i = prevNum + 1; i < 9; i++) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = prevNum - 1; i > 0; i--) {
      let cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      let cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
  }
  private canKnightMove(boards: Boards, cells: CellUpdate): boolean {
    let [ prevLetter, prevNum ] = cells.prevCell;
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
    let { newCell, prevCell } = cells;
    let [ prevLetter, num ] = prevCell;
    let prevNum = parseInt(num, 10);
    let letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);

    for (let i = letterIndex + 1, nextNum = prevNum + 1; i < this.Letters.length; i++, nextNum++) {
      if (nextNum > 8) break;
      let cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
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
      } else if (this.isEnemyInCell(boards.opponent) && cell == newCell) {
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
  private getEmptyCellsAroundKn(board: Figures, knCell: Cell): Cell[] {
    let result: Cell[] = [];
    this.getCellsAround(knCell).map((cell: Cell) => {
      if (this.checkIsCellEmpty({ board: board, opponent: board }, cell)) {
        result.push(cell);
      }
    });
    return result;
  }
  public verifyFigureMove(board: Figures, enemyBoard: Figures, figure: Figure, cell: Cell): boolean {
    let boards: Boards = {
      board: board,
      opponent: enemyBoard
    };
    let cells: CellUpdate = {
      prevCell: board.get(figure),
      newCell: cell
    };
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
    let { opponent } = this.getBoards(); 
    for (let figure of opponent) {
      if (opponent.get(figure[0]) == cell) {
        return { strikedSide: this.getOpponentSide(), figure: figure[0] };
      }
    }
  }
  public isIncomingDataValid(side?: 'w'|'b', figure?: Figure, cell?: Cell): boolean {
    if (!side || !figure || !cell) return false;
    if (this.store.side != side) return false;
    if (!this.store.getWhite().get(figure) && !this.store.getBlack().get(figure)) return false;
    return true;
  }
  public isShahAppearsAfterMove(figure: Figure, cell: Cell): boolean {
    let possibleShahes = this.store.getPossibleShahes();
    let { board, opponent } = this.getBoards();
    let knCell = board.get('Kn');
    let possibleShahesForSide = possibleShahes[this.store.side];

    let strike: null|StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (possibleShahesForSide.has(strike.figure)) return false;
    }
    board.set(figure, cell);
    for (let figure of possibleShahesForSide) {
      if (this.verifyFigureMove(opponent, board, figure, knCell)) {
        return true;
      }
    }
    return false;
  }
  public isShahRemainsAfterMove(figure: Figure, cell: Cell): boolean {
    if (!this.store.shah) return false;
    if (this.store.shah.shachedSide != this.store.side) return false;
    let { board, opponent } = this.getBoards();
    let knCell = board.get('Kn');

    let strike: null|StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (strike.figure == this.store.shah.byFigure) return false;
    }
    board.set(figure, cell);
    if (this.verifyFigureMove(opponent, board, this.store.shah.byFigure, knCell)) {
      return true;
    }
    return false;
  }
  public removeShah(): void {
    this.store.removeShah();
  }
  public setPossibleShahes(figure: Figure, cell: Cell): void { 
    let enemyKnCell: Cell = this.store.side == 'w' ?
      this.store.getBlack().get('Kn'):
      this.store.getWhite().get('Km');
    let opponentBoard: Figures = new Map();
    opponentBoard.set('Kn', enemyKnCell);
    let board: Figures = new Map();
    board.set(figure, cell);
    if (this.verifyFigureMove(board, opponentBoard, figure, enemyKnCell)) {
      this.store.setPossibleShah(this.getOpponentSide(), figure);
    }
  }
  public setFiguresStrikeAroundKn(figure: Figure) {
    let { board, opponent } = this.getBoards();
    let possibleKnMoves = this.store.side == 'w'?
      this.getEmptyCellsAroundKn(this.store.getBlack(), this.store.getBlack().get('Kn')):
      this.getEmptyCellsAroundKn(this.store.getWhite(), this.store.getWhite().get('Kn'));
    possibleKnMoves.map((cell: Cell) => {
      if (this.verifyFigureMove(board, opponent, figure, cell)) {
        this.store.setStrikeAroundKn(this.getOpponentSide(), figure);
      }
    });
  }
  public checkFiguresAroundKn() {
    let figures = this.store.getStrikeAroundKn()[this.getOpponentSide()];
    let { board, opponent } = this.getBoards();
    let knCell = opponent.get('Kn');
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
        figures.delete(figure);
      }
    }
  }
  public checkPossibleShahes(): void {
    const figures =  this.store.getPossibleShahes()[this.store.side];
    const knCell = this.store.side == 'b' ?
      this.store.getBlack().get('Kn'):
      this.store.getWhite().get('Kn');
    let board: Figures = new Map();
    let opponent: Figures = new Map();
    opponent.set('Kn', knCell);
    for (let figure of figures) {
      this.store.side == 'b' ?
        board.set(figure, this.store.getWhite().get(figure)):
        board.set(figure, this.store.getBlack().get(figure));
      if (!board.get(figure)) continue;
      if (!this.verifyFigureMove(board, opponent, figure, knCell)) {
        figures.delete(figure);
      }
      board = new Map();
    }
  }

  public setShah(movedFigure: Figure): null|ShahData {
    let { board, opponent } = this.getBoards();
    let knCell = opponent.get('Kn');
    if (this.verifyFigureMove(board, opponent, movedFigure, knCell)) {
      this.store.setShahData(this.getOpponentSide(), movedFigure);
    }
    return this.store.shah;
  }
  public setMate(movedFigure: Figure, cell: Cell): null|MateData {
    if (!this.store.shah) return null;
    let opponentSide: 'w'|'b' = this.getOpponentSide();
    let { board, opponent }: Boards = this.getBoards();
    let enemyKnCell: Cell = opponent.get('Kn');
    //if opponent can strike figure which set shah return null
    for (let opFigure in opponent) {
      if (opFigure == 'Kn') continue;
      if (this.verifyFigureMove(opponent, board, opFigure, cell)) {
        return null;
      }
    }
    let emptyCells: Cell[] = this.getEmptyCellsAroundKn(opponent, enemyKnCell);
    let figuresAroundKn: Set<Figure> = this.store.getStrikeAroundKn()[opponentSide];
    let canKnMoveCells: Cell[] = [];
    for (let i = 0; i < emptyCells.length; i++) {
      let isStrike: boolean = false;
      for (let figure of figuresAroundKn) {
        if (this.verifyFigureMove(board, opponent, figure, board.get(figure))) {
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
        matedSide: opponentSide,
        byFigure: movedFigure
      };
    } else {
      for (let i = 0; i < canKnMoveCells.length; i++) {
        if (this.verifyFigureMove(board, opponent, movedFigure, canKnMoveCells[i])) {
          return {
            matedSide: opponentSide,
            byFigure: movedFigure
          };
        }
      }
      return null;
    }
  }
  public getOpponentSide(): 'w'|'b' {
    return this.store.side == 'w' ? 'b':'w';
  }
  public removeFigure(turnSide: 'w'|'b', figure: Figure): void {
    this.store.removeFigure(turnSide, figure);
  }
  public state(): FiguresState {
    return {
      white: this.store.getWhite(),
      black: this.store.getBlack(),
    };
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
      opponent = state.b; 
    } else { 
      board = state.b; 
      opponent = state.w; 
    }
    return { board, opponent };
  }
  public updateBoard(figure: Figure, cell: Cell): void {
    this.store.updateBoard(figure, cell);
  }
}
