define('game-service', [], function() { 'use strict';

  function lookAround(board, _row, _col, callback) {
    for (var row = _row - 1, rowLen = _row + 1; row <= rowLen; row++) {
      if (!board[row]) continue;
      for (var col = _col - 1, colLen = _col + 1; col <= colLen; col++) {
        if (!board[row].arr[col] || row === _row && col === _col) continue;
        callback(row, col, board[row].arr[col]);
      }
    }
  }

  function createBoard(rowcol, mineCount) {
    for (var board =[], n = rowcol[0]; n--; ) {
      board[n] = { arr: [] };
      for (var m = rowcol[1]; m--; ) {
        board[n].arr[m] = { mark: '', isProcessed: false, isMine: false, surrounding: 0 };
      }
    }
    return createMines(board, rowcol, mineCount);
  }

  function createMines(board, rowcol, mineCount) {
    while (mineCount) {
      var row = Math.floor(Math.random() * rowcol[0]);
      var col = Math.floor(Math.random() * rowcol[1]);

      if (board[row].arr[col].isMine) continue;

      board[row].arr[col].isMine = true;
      mineCount--;
      lookAround(board, row, col, function(_row, _col, item) {
        item.surrounding += 1;
      });
    }
    return board;
  }

  return { createBoard: createBoard, lookAround: lookAround };
});
