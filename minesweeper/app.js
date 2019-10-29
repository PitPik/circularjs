require(['circular', 'game-controller', 'game-service'],
function({ Component, instance: cr }, gameCtrl, gameSrv) {

Component({
  selector: 'body',
  template: document.body.innerHTML,
  $: {
    this: ['won', 'counter', 'time', 'class'],
    board: ['isProcessed', 'mark', 'surroundingMines'],
  },
}, class Minesweeper {
  counter = 0;
  time = 0;
  class = '';
  interval;
  won;

  board = [];
  rowCol = [];
  mines = 0;

  constructor() {
    document.body.innerHTML = '';
    this.reset();
  }

  this$(propName, item, value) {
    if (propName !== 'won') return;

    this.class = value ? 'win' : value === false ? 'loose' : '';
    this.counter = this.mines -
      this.board.getElementsByProperty('mark', 'marked').length;
    if (value !== undefined) clearInterval(this.interval);
  }

  reveal(e, elm, item) {
    e.preventDefault();

    if (this.won !== undefined) return;
    if (!this.interval) {
      this.interval = setInterval(() => this.time++, 1000);
    }
    this.won = gameCtrl.checkItem(this.board, item, e.type === 'contextmenu');
  }

  huh() {
    this.class += ' huh';
  }

  level(e, elm) {
    this.reset(elm.value.split(','));
  }

  restart() {
    this.reset(this.rowCol.concat(this.mines));
  }

  reset(value = [9, 9, 10]) {
    this.rowCol = [value[0], value[1]];
    this.mines = value[2];
    this.board = gameSrv.createBoard(this.rowCol, this.mines);
    this.interval = clearInterval(this.interval);
    this.time = 0;
    this.counter = this.mines;
    this.won = undefined;
  }
}).init(document.body);

});
