(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root);
	} else if (typeof define === 'function' && define.amd) {
		define('toolbox', [], function () {
			return factory(root);
		});
	} else {
		root.Toolbox = factory(root);
	}
}(this, function(window, undefined) {
	'use strict';

	var Toolbox = {
		closest: function(element, selector, root) {
			return element && element.closest(selector);

			while(element !== root && element.parentNode) { // can be faster (root...)
				if (element.matches(selector)) { // matches(element, selector)) {
					return element;
				}
				element = element.parentNode;
			}
		},

		$: function(elm, selector) {
			return elm.querySelector(selector);
		},

		$$: function(elm, selector) {
			return elm.querySelectorAll(selector);
		},

		addClass: function(element, className) {
			element.classList.add(className);
		},

		removeClass: function(element, className) {
			element.classList.remove(className);
		},

		toggleClass: function(element, className, condition) {
			var hasClass = element.classList.contains(className);

			if (hasClass && !condition) {
				element.classList.remove(className);
			} else if (!hasClass && condition !== false) {
				element.classList.add(className);
			}
		},

		hasClass: function(element, className) {
			return element.classList.contains(className);
		},

		addEvents: function (elements, type, func, cap, _this) {
			for (var n = elements.length; n--; ) {
				Toolbox.addEvent(elements[n], type, func, cap, _this);
			}
		},

		removeEvents: function(_this, elements, type) {
			for (var n = elements.length; n--; ) {
				Toolbox.removeEvent(_this, elements[n], type);
			}
		},

		addEvent: function(element, type, func, cap, _this) {
			Toolbox.addEvent.events = Toolbox.addEvent.events || [];
			Toolbox.addEvent.events.push({ // cache references for reliable removal
				e: element,
				t: type,
				f: func,
				c: cap,
				i: (_this || Toolbox)
			});

			element.addEventListener(type, func, cap);
		},

		removeEvent: function(_this, element, type) { // removes all events from nameSpace
			var item = {},
				elmCondition = false,
				n = 0;

			for (n = (Toolbox.addEvent.events || []).length; n--; ) {
				item = Toolbox.addEvent.events[n];
				elmCondition = !element ||
					(item.e === element && (!type || type === item.t));
				if (item.i === (_this || Toolbox) && elmCondition) {
					item.e.removeEventListener(item.t, item.f, item.c);
					Toolbox.addEvent.events.splice(n, 1);
				}
			}
		},
		storageHelper: {
			fetch: function (key) {
				return JSON.parse(localStorage.getItem(key) || '[]');
			},
			save: function (todos, key) {
				Toolbox.lazy(function() {
					localStorage.setItem(key, JSON.stringify(todos));
				}, Toolbox.storageHelper);
			}
		},
		lazy: function(fn, obj) {
			clearTimeout(obj.timer);
			obj.timer = setTimeout(fn, 0);
		},

		itemsSorter: function(a, b, type, asc) {
			var textA = a[type].toUpperCase();
			var textB = b[type].toUpperCase();

			return asc ?
				textA < textB ? 1 : textA > textB ? -1 : 0 :
				textA < textB ? -1 : textA > textB ? 1 : 0;
		}

	}

	return Toolbox;
}));
