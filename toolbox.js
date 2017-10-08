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

	var resourceCache = null,
		Toolbox = {
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
			element && element.classList.add(className);
		},

		removeClass: function(element, className) {
			element && element.classList.remove(className);
		},

		toggleClass: function(element, className, condition) {
			if (!element) return;

			var hasClass = element.classList.contains(className);

			if (hasClass && !condition) {
				element.classList.remove(className);
			} else if (!hasClass && condition !== false) {
				element.classList.add(className);
			}
		},

		hasClass: function(element, className) {
			return element && element.classList.contains(className);
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
			saveLazy: function (data, key) {
				Toolbox.lazy(function() {
					Toolbox.storageHelper.save(data, key);
				}, Toolbox.storageHelper);
			},
			save: function (data, key) {
				localStorage.setItem(key, JSON.stringify(data));
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

		normalizePath: function(path) {
			var target = [];
			var src = path.split('/');
			var start = path.match(/^([./]*)/g)[0];

			for (var n = 0; n < src.length; ++n) {
				if (src[n] === '..') {
					target.pop();
				} else if (src[n] !== '' && src[n] !== '.') {
					target.push(src[n]);
				}
			}
			return start + target.join('/').replace(/[\/]{2,}/g, '/');
		},

		ajax: function(url, prefs) { // TODO: fix cache
			prefs = prefs || {};

			return new Toolbox.Promise(function(resolve, reject) {
				if (prefs.cache && ajaxCache[url] !== undefined) {
					var ss = resolver(resolve, reject, url, this);
					// console.log(ss, this)
					return ss; // this.previousPromise;
				}
				ajaxCache[url] = ajaxCache[url] || '';
				 // add previous this
				// ajaxCache[url].previousPromise = this;

				var xhr = new XMLHttpRequest();
				var method = (prefs.method || prefs.type || 'GET').toUpperCase();

				if (!xhr) {
					reject('Giving up :( Cannot create an XMLHTTP instance');
				}

				if (!prefs) { // if no prefs defined then url is actually prefs
					prefs = url;
					url = prefs.url;
				}
				xhr.onreadystatechange = function() {
					var data = getXHRData(this, prefs.dataType, reject);

					if (data !== undefined) {
						if (prefs.dataType === 'json') {
							try {
								data = JSON.parse(data);
							} catch(e) {
								reject('Caught Exception: ' + e.stack);
								return;
							}
						}
						if (prefs.cache) {
							ajaxCache[url] = data;
						}
						resolve(data);
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
			});
		},
		Promise: function(fn) {
			var state = PENDING;
			var value;
			var deferred = null;

			fn = fn.bind(this);

			function resolve(newValue) {
				if(newValue && typeof newValue.then === 'function') {
					newValue.then(resolve, reject);
					return;
				}
				state = RESOLVED;
				value = newValue;
				deferred && handle(deferred);
			}

			function reject(reason) {
				state = REJECTED;
				value = reason;
				deferred && handle(deferred);
			}

			function handle(handler) {
				if(state === PENDING) {
					deferred = handler;
					return;
				}

				setTimeout(function() {
					var out;
					var handlerCallback = state === RESOLVED ?
							handler.onResolved : handler.onRejected;

					if(!handlerCallback) {
						handler[state === RESOLVED ? 'resolve' : 'reject'](value);
						return;
					}

					try {
						out = handlerCallback(value);
					} catch(e) {
						handler.reject(e);
						return;
					}

					handler.resolve(out);
				}, 0);
			}

			this.then = function(onResolved, onRejected) {
				return new Toolbox.Promise(function(resolve, reject) {
					handle({
						onResolved: onResolved,
						onRejected: onRejected,
						resolve: resolve,
						reject: reject
					});
				});
			};

			fn(resolve, reject);
		},

		requireResources: function (data, type, container) {
			var promises = [];
			var item = null;
			var resourceName = '';
			var path = '';
			var text = '';
			var isStyles = type === 'styles';
			var attribute = isStyles ? 'href' : 'src';
			var items = isStyles ? data.links.concat(data.styles) : data.scripts;

			resourceCache = resourceCache || Toolbox.captureResources();

			while (items.length) {
				item = items.shift();
				resourceName = item.getAttribute(attribute);
				path = Toolbox.normalizePath(data.path ? data.path + '/' :
					'' + resourceName);

				if (resourceName && resourceCache[path]) {
					continue;
				}

				if (!isStyles) {
					text = item.text;
					item = document.createElement('script');
					item.setAttribute('type', 'text/javascript');
					// item.async = true;
					if (!resourceName) {
						item.text = text;
					}
					promises.push(new Toolbox.Promise(function(resolve, reject) {
						item.onload = function() {
							resolve(item);
						}
					}));
				}

				if (resourceName) {
					item[attribute] = path;
					document.head.appendChild(item);
					resourceCache[path] = item;
				} else if (container) { // TODO: check
					container.appendChild(item);
				}
			}

			return Toolbox.Promise.all(promises);
		},

		captureResources: function() {
			var cache = {};
			var resources = [].slice.call(Toolbox.$$(document, 'script'))
					.concat([].slice.call(Toolbox.$$(document, 'link')));
			var path = '';

			for (var n = resources.length; n--; ) {
				path = resources[n].getAttribute('src') ||
					resources[n].getAttribute('href');

				if (path) { // TODO: cr-dev or cr-mock
					path = Toolbox.normalizePath(path);
					cache[path] = resources[n];
				}
			}

			return cache;
		}
	}

	window.Event = window.Event || function Event(event, params) {
		var evt = document.createEvent('CustomEvent');

		params = params || {};
		evt.initCustomEvent(event,
			params.bubbles || false, params.cancelable || false, params.detail);
		return evt;
	}

	/* --------- AJAX ---------- */

	var ajaxCache = {};
	var ajaxCacheTimer = {};

	function resolver(resolve, reject, url, _this) { // TODO: check for return... on else
		if (ajaxCache[url]) {
			clearInterval(ajaxCacheTimer[url]);
			delete ajaxCacheTimer[url];
			return resolve(ajaxCache[url]);
		} else if (!ajaxCacheTimer[url]) { // wait until finished loading
			// should we reject it after a while?
			ajaxCacheTimer[url] = setInterval(function() {
				return resolver(resolve, reject, url, _this);
			}, 16);
		}
	}

	function getCSRFToken(cookieKey) {
		var start = document.cookie.split(cookieKey + '=')[1];

		return start && start.split(';')[0];
	}

	function getXHRData(xhr, dataType, reject) {
		try {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					return xhr[dataType === 'xml' ?
						'responseXML' : 'responseText'];
				} else {
					reject('There was a problem with the xhr request.');
				}
			}
		} catch(e) {
			reject('Caught Exception: ' + e.stack);
		}
	}

	/* ---------------- Promise --------------- */
	var PENDING = undefined;
	var RESOLVED = true;
	var REJECTED = false;

	Toolbox.Promise.all = function(promises) {
		var results = [];
		var merged = promises.reduce(function(accumulator, promise) {
				return accumulator.then(function() {
					return promise;
				}).then(function(result) {
					return results.push(result);
				})
			}, new Toolbox.Promise(function(resolve, reject) {
				resolve(null);
			}));

		return merged.then(function() {
			return results;
		});
	};

	return Toolbox;
}));
