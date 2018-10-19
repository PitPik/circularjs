require(['circular', 'game-controller', 'game-service'],
function(Circular, gameCtrl, gameSrv) {
  'use strict';

  var circular = new Circular();
  var rowcol = [8, 12]; // get from dropdown
  var mines = 14; // calculate from rowcol

  var gameBoard = circular.component('game-bord', {
    model: gameSrv.createBoard(rowcol, mines),
    listeners: ['*'],
    eventListeners: {
      reveal: function(e, elm, item) {
        e.preventDefault();
        if (uiModel.won !== undefined) return;
        uiModel.won = gameCtrl.checkItem(this, item, e.type === 'contextmenu');
      }
    }
  });

  var uiModel = circular.component('game', {
    model: [{ won: undefined }],
    listeners: ['won'],
    subscribe: function(propName, item, value) {
      if (value) item.views.button.classList.add('green');
    },
    eventListeners: {
      restart: function(e, elm, item) {
        item.won = undefined;
        gameBoard.reset(gameSrv.createBoard(rowcol, mines));
        item.views.button.classList.remove('green')
      },
    }
  }).model[0];
});