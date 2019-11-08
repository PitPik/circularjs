# Minesweeper

[a clasic game build with CircularJS](https://pitpik.github.io/circularjs/minesweeper/) as an example how to best seperate view from controller from services.

There is ```game.srv.js```, a service that builds the model and also provides a handy function that we can later also use in the controller for checking surrounding squares.

There is ```game.ctrl.js```, a controller that only manipulates the model or, the state of the game, nothing else.

And there is app.js that sets up the view. The following snippets show how little code is necessary to combine those components and build the view:

```javascript
Component({
  selector: 'body',
  template: template,
  subscribe$: {
    this: ['won'],
    board: ['isProcessed', 'mark'],
  },
}, class Board {
  rowCol = [9, 9];
  mines = 0;
  board = gameSrv.createBoard(this.rowCol, this.mines);
  
  won;
  
  reveal(e, elm, item) {
    if (this.won !== undefined) return;
    this.won = gameCtrl.checkItem(this.board, item, e.type === 'contextmenu');
  }
})
```

```Handlebars
<table
  class="board"
  cr-event="click: reveal; contextmenu: reveal"
>
  <tbody>
    <tr cr-for="board">
      <td
        cr-child
        class="{{%mark
          }}{{#if %%isProcessed}}
              {{#if surrounding}}color-{{surrounding}}
              {{else}}
              {{/if}}
            {{else}} hidden
            {{/if}}"
      >
        {{#if %%isProcessed}}
          {{#if surrounding}}
            {{surrounding}}
          {{/if}}
        {{/if}}
      </td>
    </tr>
  </tbody>
</table>
```

Have fun =)
