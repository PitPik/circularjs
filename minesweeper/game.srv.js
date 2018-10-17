define('game-service', [], function() { 'use strict';

  function createMines(rowcol, mineCount) {
    var board = [];

    for (var row = 0, col = 0, n = 0; n < mineCount; n++) {
      row = Math.floor(Math.random() * rowcol[0]);
      col = Math.floor(Math.random() * rowcol[1]);
      if (board[row] && board[row][col]) {
        n--;
        continue;
      }
      board[row] = board[row] || [];
      board[row][col] = true;
    }

    return board;
  }

  function lookAround(board, _row, _col, callback) {
    for (var row = _row - 1, rowLen = _row + 1; row <= rowLen; row++) {
      if (!board[row]) continue;
      for (var col = _col - 1, colLen = _col + 1; col <= colLen; col++) {
        if (!board[row].childNodes[col] ||
          row === _row && col === _col) continue;
        callback(row, col);
      }
    }
  }

  function createBoard(rowcol, mineCount) {
    var board = [];
    var mines = createMines(rowcol, mineCount);

    for (var row = 0; row < rowcol[0]; row++) {
      board[row] = { childNodes: [] };
      for (var col = 0; col < rowcol[1]; col++) {
        board[row].childNodes[col] = {
          isMine: mines[row] && !!mines[row][col],
          mark: '', // 'marked' || 'open' || 'mine' || ''
          isProcessed: false,
        };
      }
    }

    for (var row = 0; row < rowcol[0]; row++) {
      for (var col = 0; col < rowcol[1]; col++) {
        if (board[row].childNodes[col].isMine) {
          lookAround(board, row, col, function(_row, _col) {
            var count = board[_row].childNodes[_col].surroundingMines;

            board[_row].childNodes[_col].surroundingMines =
              isNaN(count) ? 1 : ++count;
          });
        }
      }
    }

    return board;
  }

  return { createBoard: createBoard, lookAround: lookAround };
});
