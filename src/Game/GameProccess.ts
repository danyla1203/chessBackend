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
    const [ letter, number ] = cell;
    const [ leftLetter, rightLetter ] = this.findNextLetter(letter);
    const nextNum = parseInt(number, 10) + 1;
    const prevNum = parseInt(number, 10) - 1;
    const result: Cell[] = [
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
    const result = [];
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
  private checkIsCellEmpty(boards: Boards, newCell: string): boolean {
    if (parseInt(newCell[1], 10) > 8) return false;
    for (const [ figure ] of boards.board) {
      if (boards.board.get(figure) === newCell) return false;
    }
    for (const [ figure ] of boards.opponent) {
      if (boards.opponent.get(figure) === newCell) return false;
    }

    return true;
  }
  private isEnemyInCell(cell: Cell): boolean {
    const { opponent } = this.getBoards();
    for (const [ figure ] of opponent) {
      if (opponent.get(figure) === cell) return true;
    }
    return false;
  }
  private canPawnMove(boards: Boards, cells: CellUpdate): boolean {
    const { newCell, prevCell } = cells;
    let sideToMove;
    if (this.store.side == 'w') {
      sideToMove = 1;
    } else {
      sideToMove = -1;
    }
  
    const [ prevLetter, prevNumber ] = prevCell;
    const prevNum = parseInt(prevNumber, 10);
    const nextLetters = this.findNextLetter(prevLetter);
    const possibleNextNum  = prevNum + sideToMove;
    const possibleMoves = [];

    const possibleNextCell = `${prevLetter}${possibleNextNum}`;
    const possibleNextDiagonalCell1 = `${nextLetters[0]}${possibleNextNum}`;
    const possibleNextDiagonalCell2 = `${nextLetters[1]}${possibleNextNum}`;

    if (possibleNextCell == newCell && this.checkIsCellEmpty(boards, newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell1 == newCell && this.isEnemyInCell(newCell)) {
      possibleMoves.push(newCell);
    }
    if (possibleNextDiagonalCell2 == newCell && this.isEnemyInCell(newCell)) {
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
    const { newCell, prevCell } = cells;
    const [ prevLetter, num ] = prevCell;
    const prevNum = parseInt(num, 10);
    for (let i = prevNum + 1; i < 9; i++) {
      const cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = prevNum - 1; i > 0; i--) {
      const cell = `${prevLetter}${i}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }

    const letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);
    for (let i = letterIndex + 1; i < this.Letters.length; i++) {
      const cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      const cell = `${this.Letters[i]}${prevNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
  }
  private canKnightMove(boards: Boards, cells: CellUpdate): boolean {
    const [ prevLetter, prevNum ] = cells.prevCell;
    const num = parseInt(prevNum, 10);
    const nextLetters = this.findNextLetter(prevLetter);
    const nextLetterRight = this.findNextLetter(nextLetters[1])[1];
    let nextLetterLeft = this.findNextLetter(nextLetters[0])[0];
    nextLetterLeft = nextLetterLeft == prevLetter ? null : nextLetterLeft;

    const possibleCells: Cell[] = [
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
    const { newCell, prevCell } = cells;
    const [ prevLetter, num ] = prevCell;
    const prevNum = parseInt(num, 10);
    const letterIndex = this.Letters.findIndex((lett) => lett == prevLetter);

    for (let i = letterIndex + 1, nextNum = prevNum + 1; i < this.Letters.length; i++, nextNum++) {
      if (nextNum > 8) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum - 1; i >= 0; i--, nextNum--) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex + 1, nextNum = prevNum - 1; i < this.Letters.length; i++, nextNum--) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
    for (let i = letterIndex - 1, nextNum = prevNum + 1; i >= 0; i--, nextNum++) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (cell == newCell) {
        return true;
      } else if (this.isEnemyInCell(newCell) && cell == newCell) {
        return true;
      } else if (!this.checkIsCellEmpty(boards, cell)) {
        break;
      }
    }
  }
  private canQueenMove(boards: Boards, cells: CellUpdate): boolean {
    const result = this.canBishopMove(boards, cells);
    return result || this.canRockMove(boards, cells);
  }
  private canKnMove(boards: Boards, cells: CellUpdate): boolean {
    const possibleMoves = this.getEmptyCellsAroundKn(boards.board, cells.prevCell);
    for (let i = 0; i < possibleMoves.length; i++) {
      if (possibleMoves[i] == cells.newCell) {
        return true;
      }
    }
    return false;
  }
  private getEmptyCellsAroundKn(board: Figures, knCell: Cell): Cell[] {
    const result: Cell[] = [];
    this.getCellsAround(knCell).map((cell: Cell) => {
      if (this.checkIsCellEmpty({ board: board, opponent: board }, cell)) {
        result.push(cell);
      }
    });
    return result;
  }
  public verifyFigureMove(board: Figures, enemyBoard: Figures, figure: Figure, cell: Cell): boolean {
    const boards: Boards = {
      board: board,
      opponent: enemyBoard
    };
    const cells: CellUpdate = {
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
    const { opponent } = this.getBoards(); 
    for (const figure of opponent) {
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
    const possibleShahes = this.store.getPossibleShahes();
    const { board, opponent } = this.getBoards();
    const knCell = board.get('Kn');
    const possibleShahesForSide = possibleShahes[this.store.side];

    const strike: null|StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (possibleShahesForSide.has(strike.figure)) return false;
    }
    board.set(figure, cell);
    for (const figure of possibleShahesForSide) {
      if (this.verifyFigureMove(opponent, board, figure, knCell)) {
        return true;
      }
    }
    return false;
  }
  public isShahRemainsAfterMove(figure: Figure, cell: Cell): boolean {
    if (!this.store.shah) return false;
    if (this.store.shah.shachedSide != this.store.side) return false;
    const { board, opponent } = this.getBoards();
    const knCell = board.get('Kn');

    const strike: null|StrikedData = this.isStrikeAfterMove(cell);
    if (strike) {
      if (strike.figure == this.store.shah.byFigure) return false;
    }
    if (figure !== 'Kn') board.set(figure, cell);
    
    this.store.turnSide = this.getOpponentSide();
    if (this.verifyFigureMove(opponent, board, this.store.shah.byFigure, knCell)) {
      this.store.turnSide = this.getOpponentSide();
      return true;
    }
    this.store.turnSide = this.getOpponentSide();
    return false;
  }
  public removeShah(): void {
    this.store.removeShah();
  }
  public setPossibleShahes(figure: Figure, cell: Cell): void { 
    const enemyKnCell: Cell = this.store.side == 'w' ?
      this.store.getBlack().get('Kn'):
      this.store.getWhite().get('Kn');
    const opponentBoard: Figures = new Map();
    opponentBoard.set('Kn', enemyKnCell);
    const board: Figures = new Map();
    board.set(figure, cell);
    
    if (this.verifyFigureMove(board, opponentBoard, figure, enemyKnCell)) {
      this.store.setPossibleShah(this.getOpponentSide(), figure);
    }
  }
  public setFiguresStrikeAroundKn(figure: Figure) {
    const { board, opponent } = this.getBoards();
    const possibleKnMoves = this.store.side == 'w'?
      this.getEmptyCellsAroundKn(this.store.getBlack(), this.store.getBlack().get('Kn')):
      this.getEmptyCellsAroundKn(this.store.getWhite(), this.store.getWhite().get('Kn'));
    possibleKnMoves.map((cell: Cell) => {
      if (this.verifyFigureMove(board, opponent, figure, cell)) {
        this.store.setStrikeAroundKn(this.getOpponentSide(), figure);
      }
    });
  }
  public checkFiguresAroundKn() {
    const figures = this.store.getStrikeAroundKn()[this.getOpponentSide()];
    const { board, opponent } = this.getBoards();
    const knCell = opponent.get('Kn');
    const possibleKnMoves = this.getEmptyCellsAroundKn(opponent, knCell);

    for (const figure of figures) {
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
    const opponent: Figures = new Map();
    opponent.set('Kn', knCell);
    for (const figure of figures) {
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
    const { board, opponent } = this.getBoards();
    const knCell = opponent.get('Kn');
    if (this.verifyFigureMove(board, opponent, movedFigure, knCell)) {
      this.store.setShahData(this.getOpponentSide(), movedFigure);
    }
    return this.store.shah;
  }
  private canCoverKnWhenShahed(): boolean|null {
    if (!this.store.shah) return null;
    const { byFigure } = this.store.shah;
    const { board, opponent } = this.getBoards();
    const cell = board.get(byFigure);
    const possibleMoves = this.getPossibleMoves(byFigure, cell);

    for (const [ figure ] of opponent) {
      for (let moveCell of possibleMoves) {
        if (this.verifyFigureMove(opponent, board, figure, moveCell)) return true;
      }
    }
  }
  public setMate(movedFigure: Figure, cell: Cell): null|MateData {
    if (!this.store.shah) return null;
    if (this.canCoverKnWhenShahed()) return null;
    const opponentSide: 'w'|'b' = this.getOpponentSide();
    const { board, opponent }: Boards = this.getBoards();
    const enemyKnCell: Cell = opponent.get('Kn');
    //if opponent can strike figure which set shah return null
    for (const opFigure in opponent) {
      if (opFigure == 'Kn') continue;
      if (this.verifyFigureMove(opponent, board, opFigure, cell)) {
        return null;
      }
    }
    const emptyCells: Cell[] = this.getEmptyCellsAroundKn(opponent, enemyKnCell);
    const figuresAroundKn: Set<Figure> = this.store.getStrikeAroundKn()[opponentSide];
    const canKnMoveCells: Cell[] = [];
    for (let i = 0; i < emptyCells.length; i++) {
      let isStrike: boolean = false;
      for (const figure of figuresAroundKn) {
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
    const side = this.store.side;
    const state = this.store.state;
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
  
  private pawnMove(currentCell: Cell): Cell[] {
    const boards = this.getBoards();
    const [ letter, number ] = [ currentCell[0], currentCell[1] ];
    const num = parseInt(number);
    const possibleMoves: string[] = [];
    let sideToMove = 0;
    if (this.store.side == 'w') {
      sideToMove = 1;
    } else {
      sideToMove = -1;
    }
    if (this.checkIsCellEmpty(boards, `${letter}${num + sideToMove}`)) {
      possibleMoves.push(`${letter}${num + sideToMove}`);
    } 
    const nextLetters = this.findNextLetter(letter);
    nextLetters[0] = `${nextLetters[0]}${num + sideToMove}`;
    nextLetters[1] = `${nextLetters[1]}${num + sideToMove}`;
    if (this.isEnemyInCell(nextLetters[0])) {
      possibleMoves.push(nextLetters[0]);
    }
    if (this.isEnemyInCell(nextLetters[1])) {
      possibleMoves.push(nextLetters[1]);
    }
    if (this.store.side == 'w' && num == 2) {
      possibleMoves.push(`${letter}${num + 2}`);
    } else if (this.store.side == 'b' && num == 7) {
      possibleMoves.push(`${letter}${num - 2}`);
    }
    return possibleMoves;
  }
  private knighMove(currentCell: Cell): Cell[] {
    const [ letter, number ] = [ currentCell[0], currentCell[1] ];
    const num = parseInt(number, 10);
    const possibleMoves: string[] = [];
    const nextLetters = this.findNextLetter(letter);
    const nextLetterRight = this.findNextLetter(nextLetters[1])[1];
    let nextLetterLeft = this.findNextLetter(nextLetters[0])[0];
    nextLetterLeft = nextLetterLeft == letter ? null : nextLetterLeft;

    const cells: Cell[] = [
      `${nextLetters[1]}${num + 2}`,
      `${nextLetterRight}${num + 1}`,
      `${nextLetterRight}${num - 1}`,
      `${nextLetters[1]}${num - 2}`,
      `${nextLetters[0]}${num - 2}`,
      `${nextLetterLeft}${num - 1}`,
      `${nextLetterLeft}${num + 1}`,
      `${nextLetters[0]}${num + 2}`
    ];
    cells.map((cell: Cell) => {
      if (cell.length != 2 || cell[1] == '0') return;
      if (this.isEnemyInCell(cell)) possibleMoves.push(cell);
      else if (this.checkIsCellEmpty(this.getBoards(), cell)) possibleMoves.push(cell);
    });
    return possibleMoves;
  }
  private rockMove(currentCell: Cell): string[] {
    const boards = this.getBoards();
    const [ letter, number ] = [ currentCell[0], currentCell[1] ];
    const num = parseInt(number, 10);
    const possibleMoves: string[] = [];

    for (let i = num + 1; i < 9; i++) {
      if (this.isEnemyInCell(`${letter}${i}`)) {
        possibleMoves.push(`${letter}${i}`);
        break;
      } else if (!this.checkIsCellEmpty(boards, `${letter}${i}`)) break;
      else possibleMoves.push(`${letter}${i}`);

    }
    for (let i = num - 1; i > 0; i--) {
      if (this.isEnemyInCell(`${letter}${i}`)) {
        possibleMoves.push(`${letter}${i}`);
        break;
      } else if (!this.checkIsCellEmpty(boards, `${letter}${i}`)) break;
      else possibleMoves.push(`${letter}${i}`);
    }

    const letterIndex = this.Letters.findIndex((lett) => lett == letter);
    for (let i = letterIndex + 1; i < this.Letters.length; i++) {
      if (this.isEnemyInCell(`${this.Letters[i]}${num}`)) {
        possibleMoves.push(`${this.Letters[i]}${num}`);
        break;
      } else if (!this.checkIsCellEmpty(boards, `${this.Letters[i]}${num}`)) break;
      else possibleMoves.push(`${this.Letters[i]}${num}`);
    }
    for (let i = letterIndex - 1; i >= 0; i--) {
      if (this.isEnemyInCell(`${this.Letters[i]}${num}`)) {
        possibleMoves.push(`${this.Letters[i]}${num}`);
        break;
      } else if (!this.checkIsCellEmpty(boards, `${this.Letters[i]}${num}`)) break;
      else possibleMoves.push(`${this.Letters[i]}${num}`);
    }
    return possibleMoves;
  }
  private bishopMove(currentCell: Cell): Cell[] {
    const [ letter, number ] = [ currentCell[0], currentCell[1] ];
    const num = parseInt(number, 10);
    const letterIndex = this.Letters.findIndex((lett) => lett == letter);
    const possibleMoves: string[] = [];
    const boards = this.getBoards();

    for (let i = letterIndex + 1, nextNum = num + 1; i < this.Letters.length; i++, nextNum++) {
      if (nextNum > 8) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (this.isEnemyInCell(cell)) {
        possibleMoves.push(cell);
        break;
      } else if (!this.checkIsCellEmpty(boards, cell)) break;
      else possibleMoves.push(cell);
    }
    for (let i = letterIndex - 1, nextNum = num - 1; i >= 0; i--, nextNum--) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (this.isEnemyInCell(cell)) {
        possibleMoves.push(cell);
        break;
      } else if (!this.checkIsCellEmpty(boards, cell)) break;
      else possibleMoves.push(cell);
    }
    for (let i = letterIndex + 1, nextNum = num - 1; i < this.Letters.length; i++, nextNum--) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (this.isEnemyInCell(cell)) {
        possibleMoves.push(cell);
        break;
      } else if (!this.checkIsCellEmpty(boards, cell)) break;
      else possibleMoves.push(cell);
    }
    for (let i = letterIndex - 1, nextNum = num + 1; i >= 0; i--, nextNum++) {
      if (nextNum <= 0) break;
      const cell = `${this.Letters[i]}${nextNum}`;
      if (this.isEnemyInCell(cell)) {
        possibleMoves.push(cell);
        break;
      } else if (!this.checkIsCellEmpty(boards, cell)) break;
      else possibleMoves.push(cell);
    }
    return possibleMoves;
  }
  private queenMove(currentCell: Cell): Cell[] {
    return [ ...this.rockMove(currentCell), ...this.bishopMove(currentCell) ];
  }
  
  private knMove(currentCell: Cell): Cell[] {
    const cells = this.getCellsAround(currentCell);
    for (let i = 0; i < cells.length; i++) {
      if (!this.checkIsCellEmpty(this.getBoards(), cells[i]) && !this.isEnemyInCell(cells[i])) {
        cells.splice(i, 1);
        i--;
      }
    }
    return cells;
  }
  public getPossibleMoves(figure: Figure, currentCell: Cell): Cell[] {
    if (/pawn/.test(figure)) return this.pawnMove(currentCell);
    if (/R/.test(figure)) return this.rockMove(currentCell);
    if (/Kn/.test(figure)) return this.knMove(currentCell);
    if (/K/.test(figure)) return this.knighMove(currentCell);
    if (/B/.test(figure)) return this.bishopMove(currentCell);
    if (/Q/.test(figure)) return this.queenMove(currentCell);

    return [];
  }
}
