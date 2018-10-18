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
    for (var board = Array(rowcol[0]), n = board.length; n--; ) {
      board[n] = { childNodes: Array.apply(null, { length: rowcol[1] })
        .map(function(v, i) {
          return { mark: '', isProcessed: false, isMine: false };
        })};
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
          var count = item.surroundingMines;

          item.surroundingMines = isNaN(count) ? 1 : count + 1;
        });
      }
    }

    return board;
  }

  return { createBoard: createBoard, lookAround: lookAround };
});
