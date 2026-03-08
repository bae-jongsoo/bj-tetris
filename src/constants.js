export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_HEIGHT = 2;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_HEIGHT;
export const DROP_MS = 800;

export const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const PIECE_SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

export const PIECE_COLOR = {
  I: '#3ed2f3',
  J: '#4f6dff',
  L: '#ff8f1a',
  O: '#ffd93d',
  S: '#40c4aa',
  T: '#b84dff',
  Z: '#ff3f6a',
};
