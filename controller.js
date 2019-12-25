define('controller', ['toolbox', 'VOM'], function(Toolbox, VOM) { 'use strict';

var keys = Toolbox.keys;

function Controller(options) {
  this.options = { element: document.body };
  this.events = {};

  for (var option in options) {
    this.options[option] = options[option];
  }
}

Controller.prototype = {
  installEvent: function(instance, element, eventName, items) {
    var componentElement = this.options.element;
    var parts = eventName.split('!');
    var name = parts[2] || parts[1] || parts[0];
    var useCapture = parts[2] ? true : parts[1] ? false :
      /(?:focus|blur|mouseenter|mouseleave)/.test(name) ? true : false;

    if (this.events[name]) return;

    this.events[name] = Toolbox.addEvent(element, name, function(e) {
      eventDelegator(e, instance, items, componentElement, VOM.getElementById);
    }, useCapture);
  },
  installEvents: function(instance, element, events, items) {
    var _this = this;

    keys(events).forEach(function(key) {
      _this.installEvent(instance, element, key, items);
    });
  },
  removeEvent: function(eventName) {
    if (this.events[eventName]) {
      this.events[eventName]();
      delete this.events[eventName];
    }
  },
  removeEvents: function(events) {
    events.forEach(this.removeEvent.bind(this));
  },
  destroy: function() {
    this.removeEvents(keys(this.events));
    this.options.element = null;
  },
};

return Controller;

function triggerEvent(instance, events, model, key, e, stopPropagation) {
  // if (!instance[key]) return console.warn(
  //   'No event handler "' + key + '" on instance:',
  //   instance
  // );
  if (!instance[key]) return;
  events[e.type][key].forEach(function(eventElement) {
    if (!stopPropagation._ && eventElement.contains(e.target)) {
      stopPropagation._ = instance[key](e, eventElement, model) === false;
      if (stopPropagation._) e.stopPropagation();
    }
  });
}

function eventDelegator(e, instance, rootItems, componentElement, getElementById) {
  var element = Toolbox.closest(e.target, '[cr-event]');
  var id = element && element.getAttribute('cr-id') ||
    Toolbox.closest(e.target, '[cr-id]').getAttribute('cr-id');
  var model = getElementById(id);
  var events = model && model.events && keys(model.events[e.type]);
  var rootEvents = rootItems && keys(rootItems.events[e.type]) || [];
  var modelHasEvents = events && events.length;
  var modelEvents = !modelHasEvents ? rootItems && rootItems.events : model && model.events;
  var sP = { _: false }; // stopPropagation

  (modelHasEvents ? events : rootItems && rootEvents || []).forEach(function(key) {
    triggerEvent(instance, modelEvents, model || rootItems, key, e, sP);
  });

  element !== componentElement && modelHasEvents && rootEvents.forEach(function(key) {
    triggerEvent(instance, rootItems.events, rootItems, key, e, sP);
  });
}

});
