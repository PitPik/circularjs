// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~75 effective lines of JavaScript.
require(['circular'], ({ App, Toolbox: { storageHelper: storage, lazy } }) => {

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
const STORAGE_KEY = 'todos-circularjs-2.0.0';

App({
  selector: 'todo-app',
  template: '{{>@content}}',
  subscribe$: { 'list:': [] },
},
class TodoApp {
  constructor() {
    this.filter = 'all';
    this.hide = true;
    this.plural = false;
    this.all = false;
    this.left = 0;
    this.none = false;
    this.list = storage.fetch(STORAGE_KEY) || [];
  }

  onInit(elm, crInst) {
    crInst.addRoute({
      path: '(/)(:filter)',
      callback: data => this.filter = data.parameters.filter || 'all',
    }, true);
    this.updateUI();
  }

  list$(prop, item) {
    prop === 'text' ? item.disabled = true : lazy(this.updateUI.bind(this), this.list);
    if (prop !== 'disabled') storage.saveLazy(this.list, STORAGE_KEY);
  }

  list$Move(type, prop, item) {
    this.list$(prop, item);
  }

  updateUI() {
    const all = this.list.length;
    const done = this.list.filterAll(item => item.done === true).length;

    this.all = all !== 0 && all === done;
    this.hide = all === 0;
    this.left = all - done;
    this.plural = all - done !== 1;
    this.none = done === 0;
  }

  toggleAll(e) {
    this.list.filterAll(item => item.done = e.target.checked);
  }

  deleteDone() {
    this.list.filterAll(item => item.done === true && this.list.remove(item));
  }

  toggleItem(e, elm, item) {
    item.done = elm.checked;
  }

  addItem(e, elm) {
    const value = elm.value.trim();

    if (e.keyCode !== ENTER_KEY || !value) return;
    this.list.unshift({ text: value, done: false, disabled: true });
    elm.value = '';
  }
  
  deleteItem(e, elm, item) {
    this.list.remove(item);
  }

  editItem(e, elm, item) {
    item.disabled = 'focus:end';
  }

  saveItem(e, elm, item) {
    const value = elm.value.trim();

    value ? item.text = value : this.list.remove(item);
  }

  blur(e, elm, item) {
    item.disabled = true;
  }

  escape(e, elm, item) {
    if (e.keyCode === ESCAPE_KEY) item.text = item.text;
  }

})});
