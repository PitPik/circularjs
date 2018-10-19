# Minesweeper

[a clasic game build with CircularJS](https://pitpik.github.io/circularjs/minesweeper/) as an example how to best seperate view from controller from services.

There is ```game.srv.js```, a service that builds the model and also provides a handy function that we can later also use in the controller for checking surrounding squares.

There is ```game.ctrl.js```, a controller that only manipulates the model or, the state of the game, nothing else.

And there is app.js that sets up the view. The following snippets show how little code is necessary to combine those components and build the view:

```javascript
var gameBoard = circular.component('game-bord', {
  model: gameSrv.createBoard(rowcol, mines),
  listeners: ['*'],
  eventListeners: {
    reveal: function(e, elm, item) {
      gameCtrl.checkItem(this, item, e.type === 'contextmenu', item.isProcessed);
    },
  },
});
```

```Handlebars
<tr cr-mount="parent" cr-template-for="game-bord">
  <td class="{{%mark}}{{#if %isProcessed}} color-{{surroundingMines}}{{else}} hidden{{/if}}" cr-event="click: reveal; contextmenu: reveal">{{#if %isProcessed}}{{surroundingMines}}{{/if}}</td>
</tr>
```

Have fun =)
