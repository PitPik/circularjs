(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root, require('toolbox'));
	} else if (typeof define === 'function' && define.amd) {
		define('controller', ['toolbox'], function (Toolbox) {
			return factory(root, Toolbox);
		});
	} else {
		root.Controller = factory(root, root.Toolbox);
	}
}(this, function(window, Toolbox) {
	'use strict';

	var Controller = function(options) {
			this.options = {
				appElement: document.body,
				eventAttribute: 'cr-event',
				// eventListeners: undefined
			};
			initController(this, options);
		},
		initController = function(_this, options) {
			for (var option in options) { // extend options
				_this.options[option] = options[option];
			}

			_this.events = {}; // listeners

			var that = _this;
			_this.eventDistributor = function eventDistributor(e, idProperty, component) {
				// TODO: cache by e.target for next vars??
				var element = Toolbox.closest(e.target,
						'[' + idProperty + ']') || component.element,
					id = element.getAttribute(idProperty),
					item = component.getElementById(id) || component
						.getElementsByProperty('elements.element', component.element)[0]; // TODO

				if (!item) { // TODO
					item = component.getElementsByProperty('elements.element', e.target)[0];
				}

				var eventElements = item && item.events[e.type],
					stopPropagation = false,
					eventElement = {};

				for (var key in eventElements) { // TODO: check for optimisation
					for (var n = eventElements[key].length; n--; ) {
						eventElement = eventElements[key][n];
						if (!stopPropagation && (eventElement === e.target ||
									eventElement.contains(e.target)) &&
								that.options.eventListeners[key]) {
							stopPropagation = that.options.eventListeners[key]
							.call(component, e, eventElement, item) === false;
						}
					}

				}
			};
		};

	Controller.prototype = {
		getEventListeners: function($$vom, element, events, component) {
			var elements = element.querySelectorAll('[' + this.options.eventAttribute + ']'),
				attribute = '',
				eventItem = '',
				eventType = '',
				eventFunc = '',
				eventParts = [];

			elements = [element].concat([].slice.call(elements));

			for (var n = elements.length; n--; ) { // reverse: stopPropagation
				attribute = elements[n].getAttribute(this.options.eventAttribute);
				if (!attribute) {
					continue;
				}
				eventParts = attribute.split(/\s*;+\s*/);
				for (var m = eventParts.length; m--; ) {
					eventItem = eventParts[m].split(/\s*:+\s*/);
					eventType = eventItem[0];
					eventFunc = eventItem[1];

					if (events[eventType] === undefined) { // write back to vom
						events[eventType] = {};
					}
					if (events[eventType][eventFunc] === undefined) {
						events[eventType][eventFunc] = [];
					}
					events[eventType][eventFunc].push(elements[n]);

					if (!this.events[eventType]) { // register inside itself
						this.events[eventType] = true;
					}
				}
			}
			if (!this.installed && this.events !== {}) {
				this.installEventListeners($$vom, component);
			}
		},
		installEventListeners: function($$vom, component) { // $$vom !!!!!
			var that = this;

			for (var key in this.events) {
				Toolbox.addEvent(this.options.appElement, key, function(e) {
					that.eventDistributor(e, $$vom.options.idProperty, component);
				}, /(?:focus|blur)/.test(key) ? true : false, this);
			}
			this.installed = true;
		},
		destroy: function() {
			Toolbox.removeEvent(this);
		}
	};

	return Controller;
}));