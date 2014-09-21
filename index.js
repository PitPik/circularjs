;(function(window, undefined){
	'use strict';

	var _instance,
		_instances = {},

		_htmlContainer = document.createElement('div'),
		_idx = 0,
		_ccl = '● ',

		Klass = function(options) {
			var initialOptions = { // this.options = {
					appendContainer: document.body
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
			// This.fireEvent('ready');
		},
		focusInstance = function(This) {
			if (This !== _instance) {
				_instance = This;
			}
		},
		// the tempaling engine must be the key: cashing, partly caching, etc...
		createView = function(This) { // this is just for demo purposes
			var options = _instances[This.uuid].options,
				html = options.template, // if url, cashe and make promise...
				node;

			html = html.replace(/{(.*?)}/g, function($1, $2) {
				// register $2 as to be listened...???
				return This.model[$2] !== undefined ? This.model[$2] : '';
			});
			_htmlContainer.innerHTML = html;
			node = _htmlContainer.firstChild;
			node.refID = This.uuid;

			return (options.appendContainer || document.body).appendChild(node);
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

	Klass.prototype.htmlNode = function() {
		return _instances[this.uuid].htmlNode;
	};


	Klass.consoleLogInstances = function() {
		console.log(_instances);
	};

	window.Klass = Klass;

	/* -------------------------------- */

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