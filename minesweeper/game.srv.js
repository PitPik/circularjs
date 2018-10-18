define('game-service', [], function() { 'use strict';

  function lookAround(board, _row, _col, callback) {
    for (var row = _row - 1, rowLen = _row + 1; row <= rowLen; row++) {
      if (!board[row]) continue;
      for (var col = _col - 1, colLen = _col + 1; col <= colLen; col++) {
        if (!board[row].childNodes[col] ||
          row === _row && col === _col) continue;
        callback(row, col, board[row].childNodes[col]);
      }
    }
  }

  function createBoard(rowcol, mineCount) {
    for (var board =[], n = rowcol[0]; n--; ) {
      board[n] = { childNodes: [] };
      for (var m = rowcol[1]; m--; ) {
        board[n].childNodes[m] =
          { mark: '', isProcessed: false, isMine: false };
      }
    }

    return createMines(board, rowcol, mineCount);
  }

  function createMines(board, rowcol, mineCount) {
    while (mineCount) {
      var row = Math.floor(Math.random() * rowcol[0]);
      var col = Math.floor(Math.random() * rowcol[1]);

      if (!board[row].childNodes[col].isMine) {
        board[row].childNodes[col].isMine = true;
        mineCount--;
        lookAround(board, row, col, function(_row, _col, item) {
          item.surroundingMines = isNaN(item.surroundingMines) ?
            1 : item.surroundingMines + 1;
        });
      }
    }

    return board;
  }

  return { createBoard: createBoard, lookAround: lookAround };
});
