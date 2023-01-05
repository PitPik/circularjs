/**! @license controller v2.0.0; Copyright (C) 2022 by Peter Dematté */
define(['toolbox'], function(Toolbox) { 'use strict';

function Controller(element) {
  this.element = element || document.body;
  this.listeners = {};
  this.events = {};
}

Controller.prototype = {
  installEvent: function(eventName, data, callbackNames, callbackFns) {
    installEvent(this, data, callbackNames, callbackFns, eventName);
  },
  removeEvent: function(eventName) { removeEvent(this, eventName) },
  destroy: function() {
    var _this = this;
    Toolbox.keys(this.listeners).forEach(function(name) { removeEvent(_this, name) });
    return this.element = null;
  },
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

// TODO: useCapture
// TODO: cache doesn't work; doesn't clean up...
function installEvent(_this, data, callbackNames, callbackFns, eventName) {
  var capture = eventName.length - (eventName = eventName.replace(/\!/g, '')).length;
  var delegate = eventName.length - (eventName = eventName.replace(/\?/g, '')).length;
  var events = _this.events[eventName] = _this.events[eventName] || {};
  var useCapture = !!/(?:focus|blur|mouseenter|mouseleave|scroll)/.test(eventName); // TODO

  data.delegate = delegate;
  for (var n = callbackNames.length, callback = ''; n--; ) {
    callback = callbackNames[n];
    events[callback] ? events[callback].push(data) : events[callback] = [data];
  }
  if (_this.listeners[eventName]) return;

  _this.listeners[eventName] = Toolbox.addEvent(_this.element, eventName, function eventCB(e) {
    eventDelegator(e, callbackFns, _this.events);
  }, useCapture || capture > 1 ? true : capture === 1 ? false : undefined);
}

function findElement(items, element) {
  for (var n = items.length; n--; ) if (items[n].element === element) return true;
}

function eventDelegator(e, callbackFns, events) {
  var path = (e.composedPath && e.composedPath()) || e.path;
  var callbacks = events[e.type];
  var cbKeys = Toolbox.keys(callbacks);
  var items = [];
  var data = {};
  var elm = {};
  var target = {};
  var key = '';
  var n = 0, m = 0;
  var cancel = false;
  var model, delegate, children = '';

  for (n = cbKeys.length; n--; ) {
    key = cbKeys[n];
    if (!callbackFns[key]) continue;

    for (m = callbacks[key].length; m--; ) {
      data = callbacks[key][m];
      if (data.model.index < 0) { // TODO: check after VOM refactor
        callbacks[key].splice(m, 1);
        continue;
      }
      elm = data.element;
      if (findElement(items, elm)) continue;
      if (path ? path.indexOf(elm) === -1 : !elm.contains(e.target)) continue;
      items.push(data);
    }
  }
  if (!items.length) return;

  items.sort(function(a, b) {
    return path ?
      path.indexOf(b.element) - path.indexOf(a.element) :
      a.element.contains(b.element) ? -1 : 1;
  });
  for (n = items.length; n--; ) {
    if (cancel) return;

    data = items[n];
    for (m = cbKeys.length; m--; ) {
      key = cbKeys[m];
      elm = data.element;
      if (!callbackFns[key] || !findElement(callbacks[key], elm)) continue;
        // || (callbacks[e.type] && callbacks[key][n].element !== callbacks[e.type][n].element)) continue;
      delegate = data.delegate;
      model = data.model;
      children = data.children;
      target = delegate ? Toolbox.findParent(e.target, data.idTag, elm) : elm;
      // TODO: !data.getElementById(target[data.idTag], true) ... return or continue;
      cancel = callbackFns[key](
        e,
        target,
        delegate ? data.getElementById(target[data.idTag], true) : model, // || data.element
        model.parentNode ? model.parentNode[children] : model[children] && model[children].parent,
        delegate && elm || undefined,
        delegate && model || undefined,
        // delegate && data.parent, // parent of this????
      ) === false || e.cancelBubble || cancel;
    }
  }
}

}, 'controller');
