require(['circular', 'game-controller', 'game-service'],
function({ Module }, gameCtrl, gameSrv) {

Module({
  selector: 'body',
  template: document.body.innerHTML + (document.body.innerHTML = '', ''),
  subscribe$: {
    this: ['won', 'counter', 'time', 'class'],
    board: ['isProcessed', 'mark', 'surrounding', 'isMine']
  },
}, class Minesweeper {
  constructor() {
    this.counter = 0;
    this.time = 0;
    this.class = '';
    this.interval;
    this.won = false;
  
    this.board = [];
    this.rowCol = [];
    this.mines = 0;
  }

  onInit(element, crInst, { views: { levels }}) {
    this.reset(levels.value.split(','));
  }

  this$(propName, item, value) {
    if (propName !== 'won') return;

    this.class = value ? 'win' : value === false ? 'loose' : '';
    this.counter = this.mines -
      this.board.getElementsByProperty('mark', 'marked').length;
    if (value !== undefined) clearInterval(this.interval);
  }

  reset(value) {
    this.rowCol = [value[0], value[1]];
    this.mines = value[2];
    this.board = gameSrv.createBoard(this.rowCol, this.mines);
    this.interval = clearInterval(this.interval);
    this.time = 0;
    this.counter = this.mines;
    this.won = undefined;
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
});

});
