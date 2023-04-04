export type Cell = string;
export type Figure = string;
export type FiguresState = {
  black: Map<Figure, Cell>;
  white: Map<Figure, Cell>;
};
export type StrikedData = {
  strikedSide: 'w' | 'b';
  figure: Figure;
};
export type ShahData = {
  shachedSide: 'w' | 'b';
  byFigure: Figure;
};
export type MateData = {
  matedSide: 'w' | 'b';
  byFigure: Figure;
};
export type PossibleShahes = {
  w: Set<Figure>;
  b: Set<Figure>;
};
export type StrikeAround = {
  w: Set<Figure>;
  b: Set<Figure>;
};
export type Figures = Map<Figure, Cell>;

export type Boards = {
  board: Figures;
  opponent: Figures;
};
export type CellUpdate = {
  prevCell: Cell;
  newCell: Cell;
};
