;(function(window, undefined){
	'use strict';

	var _instance, // rename
		_instances = {},

		_htmlContainer = document.createElement('div'),
		_idx = 0,
		_ccl = '● ',

		Klass = function(options) {
			var initialOptions = { // this.options = {
					parent: document.body
				};

			initialize(this, options, this.options || initialOptions);
		},

		initialize = function(This, options, initialOptions) {
			var instance,
				type = '';

			// --- public
			This.uuid = options.uuid || _createUUID();
			This.model = {
				index: _idx // whatever...
			};

			// --- privare
			instance = _instances[This.uuid] = {
				reference: This,
				handlers: {}
			};
			instance.options = initialOptions;
			instance.links = {};

			focusInstance(This);

			for (var key in options) {
				type = key.replace('Handler', '');
				if (key !== type) {
					This.addEventListener(type, options[key]);
				} else {
					instance.options[key] = options[key];
				}
			}

			instance.htmlNode = createView(This);

			++_idx;
			// this might take a while as template might be fetched...
			// This.fireEvent('ready');
		},
		focusInstance = function(This) {
			if (This !== _instance) {
				_instance = This;
			}
		},
		// the tempaling engine must be the key: cashing, partly caching, etc...
		createView = function(This) { // this is just for demo purposes
			var html = _instances[This.uuid].options.template, // if url, cashe and make promise...
				node;

			html = html.replace(/(.*?){(.*?)}(.*?)/g, function($1, $2, $3, $4, $5, $6) {
				// register $2 as to be listened to...???
				if (This.model[$3] !== undefined) {
					// determine id HTML, data, attribute, etc...
					_setLink($3, This);
					return $2 + This.model[$3] + $4;
				} else {
					return '';
				}
				// then parent scope
			});
			_htmlContainer.innerHTML = html;
			node = _htmlContainer.firstChild;
			node.refID = This.uuid;
			_instances[This.uuid].options.parent.appendChild(node);

			return node;
		},
		installEventHandler = function(This, type, handler, off) {
			if (!installEventHandler[type] || off) {
				document.body[off ? 'removeEventListener' : 'addEventListener'](type, function(e) {
					var instance = _instances[e.target.refID || e.uuid], // .getAttribute('data-uuid'),
						events;

					if (instance && (events = instance.handlers[e.type])) {
						for (var n = 0, m = events.length; n < m; n++) {
							events[n].call(instance.reference, e);
						}
					}
				}, false);

				installEventHandler[type] = true;
			}
		};

	Klass.prototype.addEventListener = function(type, handler) {
		var handlers = _instances[this.uuid].handlers;

		// _checkType(options[key], 'function');
		if (handlers[type]) {
			handlers[type].push(handler);
		} else {
			handlers[type] = [handler];
			installEventHandler(this, type, handler);
		}
	};

	Klass.prototype.removeEventListener = function(type, handler) {
		var events = _instances[this.uuid].handlers[type] || [];

		for (var n = 0, m = events.length; n < m; n++) {
			if ((handler.name && events[n].name === handler.name) ||
				('' + events[n] === '' + handler)) {
				events.splice(n, 1);
			}
		}
	};

	Klass.prototype.fireEvent = function(eventName) {
		var event = new Event(eventName);

		event.uuid = this.uuid;
		document.body.dispatchEvent(event);
	};

	Klass.prototype.getHTMLNode = function() {
		return _instances[this.uuid].htmlNode;
	};

	Klass.prototype.setValue = function (key, value) {
		if (this.model[key] !== value) {
			_updateLink(key, value, _instances[this.uuid]);
		}
	}


	Klass.consoleLogInstances = function() {
		console.log(_instances);
	};

	window.Klass = Klass;

	/* -------------------------------- */

	function _setLink(key, This) {
		var instance = _instances[This.uuid];

		if (!instance.links[key]) {
			instance.links[key] = This.model[key];
		}
	}

	function _updateLink(key, value, instance) { // ego update,... check for others...
		// save to server if necessary... then change instance.links[key]
		instance.reference.model[key] = value;
		if (instance.links[key] !== undefined) { // check if boud at all
			var newNode = createView(instance.reference);
			instance.options.parent.replaceChild(newNode, instance.htmlNode); // replaceNode is not good here
			instance.htmlNode = newNode;
		}
	}

	function _checkType(elm, type) {
		if (typeof elm !== type) {
			throw Error(_ccl + 'the argument was expected to be an \'' +
				type + '\' but was a ' + "'" + typeof elm + "'");
		}
	}

	function _createUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16|0,
				v = c === 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
	}
})(this);