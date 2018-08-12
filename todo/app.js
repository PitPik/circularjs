// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~94 effective lines of JavaScript.
require(['circular'], function(Circular) { 'use strict';

var ENTER_KEY = 13;
var ESCAPE_KEY = 27;
var STORAGE_KEY = 'todos-circularjs-0.1';

var circular = new Circular();
var storage = Circular.Toolbox.storageHelper;

var list = circular.component('list', {
  model: storage.fetch(STORAGE_KEY),
  listeners: ['text', 'done', 'editable'],
  subscribe: function(property, item, value, oldValue, type) {
    listCallbacks[listCallbacks[property] ?
      property : 'updateUI'](item, item.views, value);
    storage.saveLazy(this.model, STORAGE_KEY);
  },
  eventListeners: {
    toggle: function (e, element, item) {
      item.done = element.checked;
    },
    delete: function (e, element, item) {
      this.removeChild(item);
    },
    save: function (e, element, item) {
      item.text = element.value;
    },
    edit: function (e, element, item) {
      item.editable = 'focus';
    },
    blurItem: function (e, element, item) {
      item.editable = '';
    },
    escape: function (e, element, item) {
      if ((e.which || e.keyCode) === ESCAPE_KEY) {
        element.value = item.text;
        item.editable = '';
      }
    }
  }
});

var listCallbacks = {
  text: function (item, views, value) {
    item.editable = '';
  },
  updateUI: function (item, views, value) {
    Circular.Toolbox.lazy(updateUI, list);
  }
};

circular.component('app', {
  model: [{
    filter: 'all',
    completed: 0,
    plural: false,
    allCheckd: false,
    noneChecked: false,
  }],
  listeners: ['completed', 'plural', 'allCheckd', 'noneChecked'],
  eventListeners: {
    addItem: function (e, element, item) {
      var text = element.value.trim();

      if ((e.which || e.keyCode) === ENTER_KEY && text) {
        list.appendChild({ text: text, done: false, editable: '' });
        element.value = '';
      }
    },
    deleteDone: function (e, element, item) {
      var items = list.getElementsByProperty('done', true);

      for (var n = items.length; n--; ) list.removeChild(items[n]);
    },
    toggleAll: function (e, element, item) {
      var checked = e.target.checked;
      var items = list.getElementsByProperty('done', !checked);

      for (var n = items.length; n--; ) items[n].done = checked;
    }
  },
  onInit: function(component) {
    circular.addRoute({
      path: '(/)(:filter)',
      callback: function(data) {
        component.model[0].filter = data.parameters.filter || 'all';
      }
    }, true);
    updateUI();
    component.model[0].views.main.appendChild(list.container);
  }
});

function updateUI() {
  var all = list.getElementsByProperty().length;
  var checked = list.getElementsByProperty('done', true).length;
  var UIModel = circular.components['app'].model[0];

  UIModel.completed = all - checked;
  UIModel.plural = checked !== 1;
  UIModel.allCheckd = all !== 0 && all === checked;
  UIModel.noneChecked = checked === 0;
};

});