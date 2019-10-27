// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~80 effective lines of JavaScript.
require(['circular'], ({ Component, Toolbox, instance: crI }) => {

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
const STORAGE_KEY = 'todos-circularjs-1.1';
const get = 'getElementsByProperty';

const storage = Toolbox.storageHelper;

Component({
  selector: 'body',
  template: document.body.innerHTML,
  $: {
    this: ['*'],
    list: ['*'],
  },
}, class TodoApp {
  filter = 'all';
  left = 0;
  plural = false;
  all = false;
  none = false;
  hide = true;
  list = storage.fetch(STORAGE_KEY) || [];

  constructor() {
    document.body.innerHTML = '';
  }

  onInit() {
    crI.addRoute({
      path: '(/)(:filter)',
      callback: data => this.filter = data.parameters.filter || 'all',
    }, true);
    this.updateUI();
  }

  updateUI() {
    const all = this.list.length;
    const done = this.list[get]('done', true).length;

    this.all = all !== 0 && all === done;
    this.hide = all === 0;
    this.left = all - done;
    this.plural = all - done !== 1;
    this.none = done === 0;
  }

  addItem(e, elm) {
    const text = elm.value.trim();

    if (e.keyCode === ENTER_KEY && text) {
      this.list.appendChild({ text: text, done: false, editable: '' });
      elm.value = '';
    }
  }

  deleteDone() {
    this.list[get]('done', true).forEach(unit => this.list.removeChild(unit));
  }

  toggleAll(e) {
    this.list[get]('done', !e.target.checked).forEach(unit => unit.done = e.target.checked);
  }

  list$$(prop, item) {
    prop === 'text' ? item.editable = '' : Toolbox.lazy(this.updateUI.bind(this), this.list);
    if (prop !== 'editable') storage.saveLazy(this.list, STORAGE_KEY);
  }

  toggle(e, elm, item) {
    item.done = elm.checked;
  }

  delete(e, elm, item) {
    this.list.removeChild(item);
  }

  save(e, elm, item) {
    const value = elm.value.trim();

    value ? item.text = value : this.list.removeChild(item);
  }

  focus(e, elm, item) {
    const input = item.views.input;

    item.editable = 'focus';
    input.selectionStart = input.selectionEnd = input.value.length;
  }

  blur(e, elm, item) {
    item.editable = '';
  }

  keyup(e, elm, item) {
    if (e.keyCode === ESCAPE_KEY) item.text = item.text;
  }

}).init(document.body);

});
