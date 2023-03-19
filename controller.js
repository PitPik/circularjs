/**! @license controller v2.0.2; Copyright (C) 2023 by Peter Dematté */
define(['toolbox'], function(Toolbox) { 'use strict';

function Controller(element) {
  this.element = element || document.body;
  this.listeners = {};
  this.events = {};
  this.items = {};
}

Controller.prototype = {
  installEvent: function(eventName, data, callbackNames, callbackFns) {
    installEvent(this, data, eventName, callbackNames, callbackFns);
  },
  removeEvent: function(eventName) { removeEvent(this, eventName) },
  destroy: function() {
    var _this = this;
    Toolbox.keys(this.listeners).forEach(function(name) { removeEvent(_this, name) });
    return this.element = null;
  },
  setSort: function() {
    for (var key in this.items) this.items[key] = [];
  }
};

return Controller;

function removeEvent(_this, eventName) {
  var listener = _this.listeners[eventName];
  var callbacks = listener && _this.events[eventName];
  var keys = callbacks && Toolbox.keys(callbacks) || [];
  var item = {};

  if (!listener) return;

  _this.listeners[eventName] = listener(); // = null
  for (var n = keys.length; n--; ) while (item = callbacks[keys[n]].pop()) {
    item.element = item.model = null;
  }
}

function installEvent(_this, data, eventName, callbackNames, callbackFns) {
  var capture = eventName.length - (eventName = eventName.replace(/\!/g, '')).length;
  var delegate = eventName.length - (eventName = eventName.replace(/\?/g, '')).length;
  var events = _this.events[eventName] = _this.events[eventName] || {};
  var useCapture = !!/(?:focus|blur|mouseenter|mouseleave|scroll)/.test(eventName); // TODO

  if (!_this.items[eventName]) _this.items[eventName] = [];
  data.delegate = delegate;
  for (var n = callbackNames.length, callback = ''; n--; ) {
    callback = callbackNames[n] = callbackNames[n].replace(/[?!]/g, '');
    events[callback] ? events[callback].push(data) : events[callback] = [data];
  }
  if (_this.listeners[eventName]) return;

  _this.listeners[eventName] = Toolbox.addEvent(_this.element, eventName, function eventCB(e) {
    eventDelegator(e, callbackFns, _this.events, _this.items);
  }, useCapture || capture > 1 ? true : capture === 1 ? false : undefined);
}

function collect(cbKeys, callbacks, cbFns, items) {
  var n = 0, m = 0;
  var cbName = '';
  var data = callbacks; // dummy reference

  for (n = cbKeys.length; n--; ) {
    cbName = cbKeys[n];
    if (!cbFns[cbName]) continue;

    for (m = callbacks[cbName].length; m--; ) {
      data = callbacks[cbName][m];
      if (data.model.index < 0) {
        callbacks[cbName].splice(m, 1);
        continue;
      }
      items.push(data);
    }
  }

  return items.length < 2 ? items : items.sort(function(a, b) {
    return a.element.contains(b.element) ? -1 : 1;
  });
}

function eventDelegator(e, cbFns, events, cache) {
  var callbacks = events[e.type];
  var cbKeys = Toolbox.keys(callbacks);
  var path = (e.composedPath && e.composedPath()) || e.path;
  var items = cache[e.type].length ? cache[e.type] : collect(cbKeys, callbacks, cbFns, []);
  var cbName = '';
  var n = 0, m = 0;
  var cancel = false;
  var data = items[0];
  var retModel = data && data.model;
  var element = data && data.element;
  var model = retModel;

  cache[e.type] = items;
  for (n = items.length; n--; ) {
    if (cancel) return;

    data = items[n];
    if (path ? path.indexOf(data.element) === -1 : !data.element.contains(e.target)) continue;

    for (m = cbKeys.length; m--; ) {
      cbName = cbKeys[m];
      if (!cbFns[cbName] || data.callbacks.indexOf(cbName) === -1) continue;

      element = data.delegate ? Toolbox.findParent(e.target, data.idTag, data.element) : data.element;
      retModel = data.delegate ? element && data.getElementById(element[data.idTag], true) : data.model;
      model = retModel[data.children] && retModel[data.children].parent;

      if (retModel) cancel = cbFns[cbName](
        e,
        element,
        retModel,
        model,
        model && (data.delegate ? element : Toolbox.findParent(e.target, data.idTag, data.element))
      ) === false || e.cancelBubble || cancel;
    }
  }
}

}, 'controller');
