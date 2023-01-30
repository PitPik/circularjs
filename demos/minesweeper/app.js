require(['circular', 'game-controller', 'game-service'],
({ App }, gameCtrl, gameSrv) =>

App({
  selector: 'minesweeper',
  template: '{{>@content}}',
  subscribe$: { this: ['won'], 'board:arr': [] },
},
class Minesweeper {
  constructor() {
    this.counter = 0;
    this.class = '';
    this.time = 0;
    this.won = false;
    this.interval;
  
    this.board = [];
    this.rowCol = [];
    this.mines = 0;
  }

  onInit(element, crInst) {
    this.reset(crInst.getView('levels', element).value.split(','));
  }

  this$(propName, item, value) {
    if (propName !== 'won') return;

    this.class = value ? 'win' : value === false ? 'loose' : '';
    if (value !== undefined) clearInterval(this.interval);
    else this.counter = this.mines - this.board.filterAll(item => item.mark === 'marked').length;
  }

  reset([rows, cols, mines]) {
    this.rowCol = [rows, cols];
    this.mines = mines;
    this.board = gameSrv.createBoard(this.rowCol, this.mines);

    this.interval = clearInterval(this.interval);
    this.time = 0;
    this.counter = this.mines;
    this.won = undefined;
  }

  reveal(e, elm, item) {
    e.preventDefault();

    if (this.won !== undefined || !item.parentNode) return this.won = this.won;
    if (!this.interval) this.interval = setInterval(() => this.time++, 1000);

    this.won = gameCtrl.checkItem(this.board, item, e.type === 'contextmenu');
  }

  huh() {
    if (this.won === undefined) this.class = 'huh';
  }

  setLevel(e, {value}) {
    this.reset(value.split(','));
  }

  restart() {
    this.reset([...this.rowCol, this.mines]);
  }

}));
