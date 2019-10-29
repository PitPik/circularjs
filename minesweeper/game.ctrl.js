define('game-controller', ['game-service'], function(gameSrv) {  'use strict';

  function lookAround(model, item, checkAround, foundMarked) {
    gameSrv.lookAround(model, item.parentNode.index, item.index,
      function(row, col, foundItem) {
        if (foundMarked !== undefined) {
          if (foundItem.mark === 'marked') foundMarked++;
        } else if (checkAround || !foundItem.isMine && !foundItem.isProcessed) {
          checkItem(model, foundItem);
        }
      });

    return foundMarked;
  }

  function checkAll(items) {
    for (var x = items.length; x--; )
      if (!items[x].isMine || items[x].mark !== 'marked') return;

    return true;
  }

  function checkItem(model, item, mark) {
    if (item.isProcessed && mark !== undefined) {
      delete checkItem._win && lookAround(model, item, false, 0) ===
        item.surrounding && lookAround(model, item, true);
      if (checkItem._win === false) return false;
    } else if (mark && !item.isProcessed) {
      item.mark = item.mark === 'marked' ? 'open' :
        item.mark === 'open' ? '' : 'marked';
    } else if (item.isMine && item.mark !== 'marked') {
      model.getElementsByProperty('isMine', true).forEach(function(_item) {
        _item.mark = _item === item ? 'mine last' : 'mine';
      });
      return checkItem._win = false; // no proper return on lookAround
    } else if (item.mark !== 'marked' && !item.isProcessed) {
      item.mark = '';
      item.isProcessed = true;
      if (!item.surrounding) lookAround(model, item);
    }
    return checkAll(model.getElementsByProperty('isProcessed', false));
  }

  return { checkItem: checkItem };
});
