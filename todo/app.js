// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~69 effective lines of JavaScript.
require(['circular'], Circular => { 'use strict';

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
const STORAGE_KEY = 'todos-circularjs-0.1';

const circular = new Circular();
const lazy = Circular.Toolbox.lazy;
const storage = Circular.Toolbox.storageHelper;

const list = circular.component('list', {
  model: storage.fetch(STORAGE_KEY),
  listeners: ['*'],
  subscribe: (property, item) => {
    property === 'text' ? (item.editable = '') : lazy(updateUI, list);
    property !== 'editable' && storage.saveLazy(list.model, STORAGE_KEY);
  },
  eventListeners: {
    toggle: (e, elm, item) => item.done = elm.checked,
    delete: (e, elm, item) => list.removeChild(item),
    save: (e, elm, item) => item.text = elm.value,
    edit: (e, elm, item) => item.editable = 'focus',
    blurItem: (e, elm, item) => item.editable = '',
    escape: (e, elm, item) => {
      if ((e.which || e.keyCode) === ESCAPE_KEY) {
        elm.value = item.text;
        item.editable = '';
      }
    },
  }
});

const updateUI = () => {
  const all = list.getElementsByProperty().length;
  const done = list.getElementsByProperty('done', true).length;
  const appModel = circular.components['app'].model[0];

  appModel.all = all !== 0 && all === done;
  appModel.hide = all === 0;
  appModel.left = all - done;
  appModel.plural = all - done !== 1;
  appModel.none = done === 0;
};

circular.component('app', {
  model: [{ filter: 'all', left: 0, plural: false, all: false, none: false, hide: true }],
  listeners: ['*'],
  eventListeners: {
    addItem: (e, elm, item) => {
      const text = elm.value.trim();

      if ((e.which || e.keyCode) === ENTER_KEY && text) {
        list.appendChild({ text: text, done: false, editable: '' });
        elm.value = '';
      }
    },
    deleteDone: (e, elm, item) => {
      const done = list.getElementsByProperty('done', true);

      for (let n = done.length; n--; ) list.removeChild(done[n]);
    },
    toggleAll: (e, elm, item) => {
      const checked = e.target.checked;
      const items = list.getElementsByProperty('done', !checked);

      for (let n = items.length; n--; ) items[n].done = checked;
    }
  },
  onInit: self => {
    circular.addRoute({
      path: '(/)(:filter)',
      callback: data => self.model[0].filter = data.parameters.filter || 'all',
    }, true);
    updateUI();
    self.model[0].views.main.appendChild(list.container);
  }
});

});
