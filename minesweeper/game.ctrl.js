define('game-controller', ['game-service'], function(gameSrv) {  'use strict';

  function lookAround(inst, item, checkAround, foundMarked) {
    gameSrv.lookAround(inst.model, item.parentNode.index, item.index,
      function(row, col, foundItem) {
        if (foundMarked !== undefined) {
          if (foundItem.mark === 'marked') foundMarked++;
        } else if (checkAround) {
          checkItem(inst, foundItem);
        } else if (!foundItem.isMine && !foundItem.isProcessed) {
          foundItem.mark = '';
          foundItem.isProcessed = true;
          if (!foundItem.surroundingMines) lookAround(inst, foundItem);
        }
      });

    return foundMarked;
  }

  function checkAll(items) {
    for (var x = items.length; x--; )
      if (!items[x].isMine || items[x].mark !== 'marked') return;

    return true;
  }

  function checkItem(inst, item, mark, checkAround) {
    if (checkAround) {
      lookAround(inst, item, false, 0) === item.surroundingMines &&
        lookAround(inst, item, true);
    } else if (mark && !item.isProcessed) {
      item.mark = item.mark === 'marked' ? 'open' :
        item.mark === 'open' ? '' : 'marked';
    } else if (item.isMine && item.mark !== 'marked') {
      inst.getElementsByProperty('isMine', true).forEach(function(_item) {
        _item.mark = _item === item ? 'mine last' : 'mine';
      });
      return false;
    } else if (item.mark !== 'marked' && !item.isProcessed) {
      item.mark = '';
      item.isProcessed = true;
      if (!item.surroundingMines) lookAround(inst, item);
    }

    return checkAll(inst.getElementsByProperty('isProcessed', false));
  }

  return { checkItem: checkItem };
});
