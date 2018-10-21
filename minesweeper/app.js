require(['circular', 'game-controller', 'game-service'],
function(Circular, gameCtrl, gameSrv) { 'use strict';

  var circular = new Circular();
  var reset = function(e, elm, item) { // reset game and gameBoard
    var value = elm.value.split(',');

    item.rowcol = [value[0], value[1]];
    item.mines = value[2];
    item.interval = clearInterval(item.interval);
    item.views.timer.textContent = 0;
    gameBoard.reset(gameSrv.createBoard(item.rowcol, item.mines));
    item.won = undefined;
  };

  var gameBoard = circular.component('game-bord', {
    listeners: ['*'],
    eventListeners: {
      reveal: function(e, elm, item) {
        e.preventDefault();
        if (uiModel.won !== undefined) return;
        if(!uiModel.interval) { // start timer
          uiModel.interval = setInterval(function() {
            uiModel.views.timer.textContent = +uiModel.views.timer.textContent + 1;
          }, 1000);
        }
        uiModel.won = gameCtrl.checkItem(this, item, e.type === 'contextmenu');
      },
      huh: function(e, elm, item) { // make "o" face
        uiModel.elements.element.classList.add('huh');
      },
    }
  });

  var uiModel = circular.component('game', { // component without template
    model: [{ won: true, rowcol: [0, 0], mines: 0 }],
    listeners: ['won'],
    subscribe: function(propName, item, value) {
      item.elements.element.className =
        value ? 'win' : value === false ? 'loose' : '';
      item.views.counter.textContent = item.mines -
        gameBoard.getElementsByProperty('mark', 'marked').length;
      if (value !== undefined) clearInterval(item.interval);
    },
    eventListeners: {
      restart: function(e, elm, item) {
        reset(null, item.views.level, item);
      },
      level: reset,
    },
    onInit: function(inst) {
      reset(null, inst.model[0].views.level, inst.model[0]);
    },
  }).model[0];
});