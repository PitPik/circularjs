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
		},

		ajax: function(url, prefs) {
			var xhr = new XMLHttpRequest();
			var method = (prefs.method || prefs.type || 'GET').toUpperCase();

			if (!xhr) {
				prefs.error && prefs.error(null,
					'Giving up :( Cannot create an XMLHTTP instance');
				return false;
			}

			if (!prefs) { // if no prefs defined then url is actually prefs
				prefs = url;
				url = prefs.url;
			}
			xhr.onreadystatechange = function() {
				var data = getXHRData(this, prefs);

				if (data !== undefined) {
					return parseXHRData(data, prefs);
				}
			}
			xhr.open(method, url);

			if (prefs.dataType === 'xml') {
				xhr.setRequestHeader('Content-Type', 'text/xml');
			}
			if (method !== 'GET' && prefs.csrf) {
				xhr.setRequestHeader('X-CSRF-Token', getCSRFToken(prefs.csrf));
			}
			if (prefs.headers) { // add more headers
				for (var header in prefs.headers) {
					xhr.setRequestHeader(header, prefs.headers[header]);
				}
			}

			xhr.send(prefs.data);
		}
	}

	/* --------- AJAX ---------- */

	function getCSRFToken(cookieKey) {
		var start = document.cookie.split(cookieKey + '=')[1];

		return start && start.split(';')[0];
	}

	function getXHRData(xhr, prefs) {
		try {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					return xhr[prefs.dataType === 'xml' ?
						'responseXML' : 'responseText'];
				} else {
					prefs.error && prefs.error(null,
						'There was a problem with the xhr request.');
				}
			}
		} catch(e) {
			prefs.error && prefs.error(e, 'Caught Exception: ' + e.stack);
		}
	}

	function parseXHRData(data, prefs) {
		if (prefs.dataType === 'json') {
			try {
				data = JSON.parse(data);
			} catch(e) {
				prefs.error && prefs.error(e, 'Caught Exception: ' + e.stack);
				return;
			}
		}
		return prefs.success(data);
	}

	return Toolbox;
}));
