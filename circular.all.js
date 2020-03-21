/**! @license amd v0.1.0; Copyright (C) 2019 by Peter Dematté */
!(function (root) {
'use strict';

var mathRand = root.Math.random;
var link = document.createElement('a');
var documentFragment = root.document.createDocumentFragment();
var timer = 0;
var modules = require.modules = {};
var executedModule = {};

define.amd = {};
require.config = config;
require.getFile = function (resource, markAsDone) { return resource; };
root.define = define;
root.require = require;
config({});

function getRandomName() {
	return '_module_' + (mathRand() + mathRand());
}

function normalizePath(path) {
	link.href = path;
	return (path.indexOf(link.host) !== -1 ? link.origin : '') +
		link.pathname + link.search;
}

function getPathFromName(name) {
	var postFix = /(?:^\!|^http[s]*:|.*\.js$)/.test(name) ? '' : '.js';
	var path = '';

	name = (require.paths[name] || name).replace(/^\!/, '');
	path = normalizePath((require.baseUrl || '.') + '/' +
		name + postFix).replace(/^.\//, '');
	return require.mapPath ? require.mapPath(name, postFix, path) : path;
}

function config(config) {
	var exceptions = { mapPath: 'function', baseUrl: 'string' };
	var items = ['lookaheadMap', 'paths', 'options', 'mapPath', 'baseUrl'];

	if (!require[items[0]]) { // init first time
		for (var n = items.length; n--;) {
			require[items[n]] = exceptions[items[n]] === 'string' ? '' :
				exceptions[items[n]] === 'function' ? null : {};
		}
	}
	for (var item in config) {
		if (items.indexOf(item) === -1) continue; // whitelist only
		if (!exceptions[item]) {
			for (var key in config[item]) require[item][key] = config[item][key];
		} else {
			require[item] = config[item];
		}
	}
	return require;
}

function lookaheadForDeps(name) {
	var deps = require.lookaheadMap[name];
	var minifyPrefix = require.options.minifyPrefix; // ??

	if (!deps || (require.paths[name] || '').indexOf(minifyPrefix) !== -1) {
		return;
	}
	require(deps);
	for (var n = 0, m = deps.length; n < m; n++) {
		if (!modules[deps[n]]) {
			lookaheadForDeps(deps[n]);
		}
	}
}

function checkIfDone(module) {
	var deps = module.deps;
	var done = true;

	for (var n = deps.length; n--;) {
		if (modules[deps[n]] && modules[deps[n]].done === undefined) {
			done = false;
		}
	}
	if (done) markAsDone(module);
}

function markAsDone(module) {
	var parents = module.parents || [];

	if (module.factory && !module.isFile) {
		module.done = module.factory.apply(null, module.deps.map(function (dep) {
			return modules[dep].done;
		}));
		delete module.factory;
	} else if (module.done === undefined) {
		delete modules[module.name]; // from lookaheadForDeps()
	}

	for (var n = parents.length; n--;) {
		if (modules[parents[n]]) {
			checkIfDone(modules[parents[n]]);
		}
	}
}

function appendScript(script) {
	documentFragment.appendChild(script);
	clearTimeout(timer);
	timer = setTimeout(function () {
		document.head.appendChild(documentFragment);
	});
}

function applyScript(module, sync) {
	var script = root.document.createElement('script');

	script.type = 'text/javascript';
	script.async = script.defer = !sync ? true : false;
	script.charset = 'utf-8';
	script.onload = script.onreadystatechange = (function (data) {
		return function (e) {
			var target = e.currentTarget || e.srcElement;

			if (e.type === 'load' || target.readyState === 'complete') {
				script.onload = script.onreadystatechange = null;
				onScriptLoaded(data);
			}
		};
	})(module);
	script.src = module.path;

	return script;
}

function onScriptLoaded(module) {
	var module = modules[module.name];

	if (executedModule.name.indexOf('_module_') === 0) {
		module.done = executedModule.done;
		module.factory = executedModule.factory;
		module.deps = executedModule.deps;
		// renaming in dependencies for anonymous modules
		for (var n = module.deps.length, parents = {}; n--;) {
			parents = modules[module.deps[n]].parents;
			parents[parents.indexOf(executedModule.name)] = module.name;
		}
		delete modules[executedModule.name];
	}
	checkIfDone(module);
}

function getDependencies(parentName, deps, sync) {
	for (var n = deps.length, module = {}, name = ''; n--;) {
		name = deps[n];
		if (modules[name]) {
			modules[name].parents.push(parentName);
			continue;
		}
		module = modules[name] = {
			name: name,
			isFile: name.charAt(0) === '!',
			path: getPathFromName(name),
			parents: [parentName]
		};
		if (module.isFile) {
			require.getFile(module, markAsDone);
		} else {
			appendScript(applyScript(module, sync));
			lookaheadForDeps(name);
		}
	}
}

function require(deps, factory, sync) {
	deps.constructor === Array ?
		define(getRandomName(), deps, factory, sync) :
		define(getRandomName(), [], deps, factory);
}

function define(name, deps, factory, sync) {
	var module = {};

	if (typeof name !== 'string') {
		return require(name, deps, factory); // shifting arguments
	}
	name = name || getRandomName();
	module = modules[name];
	getDependencies(name, deps, sync);

	if (module) { // is dependency
		module.deps = deps;
		module.factory = factory;
	} else { // is not dependency
		module = modules[name] =
			{ name: name, deps: deps, factory: factory, parents: [] };
		checkIfDone(module);
	}
	executedModule = module;
}

})(this);

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
}(this, function (window, undefined) {
'use strict';

// var resourceCache = null;
var _link = document.createElement('a');
var types = {
	'undefined': undefined,
	'null': null,
	'NaN': NaN,
	'true': true,
	'false': false,
};
var Toolbox = {
	convertToType: function (value) {
		return types.hasOwnProperty(value) ? types[value] :
			value.toString && +value.toString() === value ? +value : value;
	},
	closest: function (element, selector, root) {
		if (element.closest) {
			Toolbox.closest = function (element, selector) {
				return element.closest(selector);
			}
		} else {
			var matches = (element.msMatchesSelector ||
				element.webkitMatchesSelector || element.matches);

			Toolbox.closest = function (element, selector) {
				if (!(root || document.documentElement).contains(element)) return null;
				do {
					if (matches.call(element, selector)) return element;
					element = element.parentElement || element.parentNode;
				} while (element !== null && element.nodeType === 1);
				return null;
			};
		}
		return Toolbox.closest(element, selector, root);
	},
	// isConnected: function(elm, context) {
	//   return elm.isConnected !== undefined ?
	//     elm.isConnected || context.contains(elm) :
	//     context.contains(elm);
	// },
	$create: function (tag, className) {
		var elm = document.createElement(tag);

		if (className) {
			elm.className = className;
		}
		return elm;
	},
	$: function (selector, root) {
		return (root || document).querySelector(selector);
	},

	$$: function (selector, root) {
		return (root || document).querySelectorAll(selector);
	},

	parentsIndexOf: function (elements, target) {
		for (var n = elements.length; n--;) {
			if (elements[n].contains(target)) {
				return n;
			}
		}
		return -1;
	},

	keys: function (obj) {
		var result = [];

		for (var key in obj) if (obj.hasOwnProperty(key)) result.push(key);

		return result;
	},

	isArray: Array.isArray || function (obj) { // obj instanceof Array;
		return obj && obj.constructor === Array;
	},

	// extendClass: function(newClass, Class) {
	//   newClass.prototype = Object.create(Class.prototype);
	//   newClass.prototype.constructor = newClass;
	//   newClass.prototype._super = Class;
	// },

	addClass: function (element, className) {
		element && element.classList.add(className);
	},

	removeClass: function (element, className) {
		element && element.classList.remove(className);
	},

	toggleClass: function (element, className, condition) {
		if (!element) return;

		var hasClass = element.classList.contains(className);

		if (hasClass && !condition) {
			element.classList.remove(className);
		} else if (!hasClass && condition !== false) {
			element.classList.add(className);
		}
	},

	hasClass: function (element, className) {
		return element && element.classList.contains(className);
	},

	toggleClasses: function (oldElm, newElm, oldClass, newClass) {
		oldElm && oldClass && Toolbox.removeClass(oldElm, oldClass);
		newElm && Toolbox.addClass(newElm, newClass || oldClass);
	},

	addEvents: function (elements, type, func, cap) {
		var collection = [];

		for (var n = elements.length; n--;) {
			collection.push(Toolbox.addEvent(elements[n], type, func, cap));
		}
		return collection;
	},

	removeEvents: function (collection) {
		for (var n = collection.length; n--;) collection[n]();
	},

	addEvent: function (element, type, func, cap) {
		cap = cap !== undefined ? cap :
			/(?:focus|blur|mouseenter|mouseleave)/.test(type) ? true : false;

		element.addEventListener(type, func, cap);

		return function removeEvent() { element.removeEventListener(type, func, cap) };
	},

	storageHelper: {
		fetch: function (key) {
			var data = localStorage.getItem(key);
			return data ? JSON.parse(data) : data;
		},
		saveLazy: function (data, key, obj) {
			Toolbox.lazy(function () {
				Toolbox.storageHelper.save(data, key);
			}, obj || Toolbox.storageHelper);
		},
		save: function (data, key) {
			localStorage.setItem(key, JSON.stringify(data));
		}
	},
	lazy: function (fn, obj, pref) {
		clearTimeout(obj._timer);
		obj._timer = setTimeout(fn, 0, pref);
	},

	itemsSorter: function (a, b, type, asc) {
		var textA = a[type].toUpperCase();
		var textB = b[type].toUpperCase();

		return asc ?
			textA < textB ? 1 : textA > textB ? -1 : 0 :
			textA < textB ? -1 : textA > textB ? 1 : 0;
	},

	normalizePath: function (path) {
		_link.href = path;
		return (path.indexOf(_link.host) !== -1 ? _link.origin : '') +
			_link.pathname + _link.search;
	},

	ajax: function (url, prefs) {
		var promise = null;
		var cache = false;
		var now = new Date().getTime();
		var time = 0;

		prefs = prefs || {};
		url = Toolbox.normalizePath(url);
		time = ajaxCache[url] && ajaxCache[url].time || 0;
		cache = prefs.cache === true ? now + 1e8 : // 1e8 ~= 1 year
			!prefs.cache ? 0 : (time > now ? time : now + prefs.cache);
		promise = cache && !prefs.resetCache && time > now ? ajaxCache[url] : null;

		promise = promise || new Toolbox.Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			var method = (prefs.method || prefs.type || 'GET').toUpperCase();

			if (!xhr) {
				reject('Giving up :( Cannot create an XMLHTTP instance');
			}

			if (!prefs) { // if no prefs defined then url is actually prefs
				prefs = url;
				url = prefs.url;
			}
			xhr.onreadystatechange = function () {
				var data = getXHRData(this, prefs.dataType, reject);

				if (data !== undefined) {
					if (prefs.dataType === 'json') {
						try {
							data = JSON.parse(data);
						} catch (e) {
							reject('Caught Exception: ' + e.stack);
							return;
						}
					}
					resolve(data);
				}
			};
			xhr.open(method, url, prefs.async || true, prefs.username, prefs.password);

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
			return function abortXHR() {
				xhr.abort();
			};
		});

		if (cache) {
			ajaxCache[url] = promise;
			ajaxCache[url].time = cache;
		} else {
			delete ajaxCache[url];
		}

		return promise;
	},
	errorHandler: function (e) {
		console.error(e);
	},
	Promise: Promise,
}

function Event(event, params) {
	var evt = document.createEvent('CustomEvent');

	params = params || {};
	evt.initCustomEvent(event,
		params.bubbles || false, params.cancelable || false, params.detail);
	return evt;
}

window.Event = window.Event || Event;
window.CustomEvent = window.CustomEvent || Event;

/* --------- AJAX ---------- */

var ajaxCache = {};

function getCSRFToken(cookieKey) {
	var start = document.cookie.split(cookieKey + '=')[1];

	return start && start.split(';')[0];
}

function getXHRData(xhr, dataType, reject) {
	try {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status < 200 || xhr.status > 299) {
				var error = new Error(xhr.statusText);
				error.response = xhr.response;
				reject(error);
			} else {
				return xhr[dataType === 'xml' ?
					'responseXML' : 'responseText'];
			}
		}
	} catch (e) {
		reject('Caught Exception: ' + e.stack);
	}
}
/* ---------------- Promise --------------- */

function Promise(fn) {
	this._state = 0;
	this._handled = false;
	this._value = undefined;
	this._deferreds = [];
	this._returnFn = doResolve(fn, this);
}

Promise._cache = {};

function handle(self, deferred) {
	while (self._state === 3) {
		self = self._value;
	}
	if (self._state === 0) {
		self._deferreds.push(deferred);
		return;
	}
	self._handled = true;
	setTimeout(function () {
		var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
		var ret;

		if (cb === null) {
			(self._state === 1 ? resolve : reject)(deferred.promise, self._value);
			return;
		}
		try {
			ret = cb(self._value);
		} catch (e) {
			reject(deferred.promise, e);
			return;
		}
		resolve(deferred.promise, ret);
	});
}

function resolve(self, newValue) {
	try {
		if (newValue) {
			var then = newValue.then;
			if (newValue instanceof Promise) {
				self._state = 3;
				self._value = newValue;
				finale(self);
				return;
			} else if (typeof then === 'function') {
				return doResolve(then.bind(newValue), self);
			}
		}
		self._state = 1;
		self._value = newValue;
		finale(self);
	} catch (e) {
		reject(self, e);
	}
}

function reject(self, newValue) {
	self._state = 2;
	self._value = newValue;
	finale(self);
}

function finale(self) {
	if (self._state === 2 && self._deferreds.length === 0) {
		setTimeout(function () {
			if (!self._handled) {
				console.warn('Possible Unhandled Promise Rejection:', self._value);
			}
		});
	}

	for (var i = 0, len = self._deferreds.length; i < len; i++) {
		handle(self, self._deferreds[i]);
	}
	self._deferreds = null;
}

function doResolve(fn, self) {
	var done = false;
	var rejectFn = function (value) {
		if (done) return;
		done = true;
		reject(self, value);
	};

	try {
		return fn(function (value) {
			if (done) return;
			done = true;
			resolve(self, value);
		}, rejectFn);
	} catch (ex) {
		rejectFn(ex);
	}
}

Promise.prototype['catch'] = function (onRejected) {
	return this.then(null, onRejected || function (error) {
		console.error(error);
	});
};

Promise.prototype.then = function (onFulfilled, onRejected) {
	var _returnFn = this._returnFn;
	var promise = new Promise(function () { return _returnFn });

	handle(this, {
		onFulfilled: onFulfilled || null,
		onRejected: onRejected || null,
		promise: promise
	});
	return promise;
};

Promise.prototype.cancel = function (id) {
	var promise = Promise._cache[id];

	Promise._cache[id] = this;
	if (!promise) return this;

	if (promise._state !== 1) {
		if (promise._returnFn && typeof promise._returnFn === 'function') {
			promise._returnFn();
		}
		promise._deferreds = [];
		promise.then = promise['catch'] = function () { };
		promise._handled = true;
		promise._state = 1;
	}
	promise._returnFn = null;

	return this;
};

Promise.all = function (promises) {
	var results = [];
	var merged = promises.reduce(function (accumulator, promise) {
		return accumulator.then(function () {
			return promise;
		}).then(function (result) {
			return results.push(result);
		});
	}, new Promise(function (resolve, reject) {
		resolve(null);
	}));

	return merged.then(function () {
		return results;
	});
};

if (window.require) {
	require.getFile = function (resource, markAsDone) {
		Toolbox.ajax(resource.path, {
			cache: resource.name.substr(0, 2) !== '!!'
		}).then(function (data) {
			resource.done = data;
			markAsDone(resource);
		})
	}
}

return Toolbox;

}));

/**! @license schnauzer v1.5.0; Copyright (C) 2017-2020 by Peter Dematté */
(function (global, factory) {
if (typeof exports === 'object') module.exports = factory(global);
else if (typeof define === 'function' && define.amd)
	define('schnauzer', [], function () { return factory(global); });
else global.Schnauzer = factory(global);
}(this && this.window || global, function (global, undefined) {
'use strict';

var getObjectKeys = Object.keys || function (obj) {
	var fn = function (obj, key, keys) { obj.hasOwnProperty(key) && keys.push(key) };
	var keys = [];
	for (var key in obj) fn(obj, key, keys);
	return keys;
};
var cloneObject = function (obj, newObj) {
	var fn = function (obj, newObj, key) { newObj[key] = obj[key] };
	for (var key in obj) fn(obj, newObj, key);
	return newObj;
};
var concatArrays = function (array, host) {
	for (var n = 0, l = array.length; n < l; n++) host[host.length] = array[n];
	return host;
};

var Schnauzer = function (template, options) {
	this.version = '1.5.0';
	this.partials = {};
	this.options = {
		tags: ['{{', '}}'],
		entityMap: {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
			'/': '&#x2F;',
			'`': '&#x60;',
			'=': '&#x3D;'
		},
		helpers: {},
		partials: {},
		self: 'self',
		nameCharacters: '',
		escapeHTML: true,
		renderHook: null,
	};
	initSchnauzer(this, options || {}, template);
};

var initSchnauzer = function (_this, options, template) {
	for (var option in options) _this.options[option] = options[option];
	options = _this.options;
	switchTags(_this, options.tags);
	_this.entityRegExp =
		new RegExp('[' + getObjectKeys(options.entityMap).join('') + ']', 'g');
	_this.helpers = options.helpers;
	for (var name in options.partials)
		_this.registerPartial(name, options.partials[name]);
	if (template) _this.parse(template);
};

Schnauzer.prototype = {
	render: function (data, extra) {
		return this.partials[this.options.self](getScope(data, extra || {}));
	},
	parse: function (text) {
		return this.registerPartial(this.options.self, text);
	},
	registerHelper: function (name, helperFn) {
		this.helpers[name] = helperFn;
	},
	unregisterHelper: function (name) {
		delete this.helpers[name];
	},
	registerPartial: function (name, text) {
		return this.partials[name] = this.partials[name] ||
			(text.constructor === Function ? text : sizzleBlocks(this, text, []));
	},
	unregisterPartial: function (name) {
		delete this.partials[name];
	},
	setTags: function (tags) {
		switchTags(this, tags);
	},
};

return Schnauzer;

function switchTags(_this, tags) {
	var tgs = tags[0] === '{{' ? ['({{2,3}~*)', '(~*}{2,3})'] : tags;
	var chars = _this.options.nameCharacters + '!-;=?@[-`|';
	var blockEnd = (tgs[0] + '\\/\\3' + tgs[1]).replace(/[()]/g, '');

	_this.inlineRegExp = new RegExp(tgs[0] + '([>!&=])*\\s*([\\w\\' +
		chars + '<>|\\.\\s]*)' + tgs[1], 'g');
	_this.sectionRegExp = new RegExp(tgs[0] + '([#^][*%]*)\\s*([\\w' +
		chars + '~]*)(?:\\s+([\\w$\\s|.\\/' + chars + ']*))*' + tgs[1] +
		'(?:\\n*)((?:(?!' + tgs[0] + '[#])[\\S\\s])*?)(' + blockEnd + ')', 'g');
	_this.elseSplitter = new RegExp(tgs[0] + '(?:else|\\^)\\s*(.*?)' + tgs[1]);
}

// ---- render data helpers

function escapeHtml(string, _this, doEscape) {
	return doEscape && _this.options.escapeHTML ?
		String(string).replace(_this.entityRegExp, function (char) {
			return _this.options.entityMap[char];
		}) : string;
}

function createHelper(idx, key, len, value, parent) {
	return {
		'@index': idx,
		'@last': idx === len - 1,
		'@first': idx === 0,
		'@length': len,
		'@parent': parent,
		'@key': key,
		'this': value,
		'.': value,
	};
}

function shiftScope(scopes, data, helpers, level, replace) {
	data = { scope: data, helpers: helpers, level: level };
	return replace ? (scopes[0] = data, scopes) : concatArrays(scopes, [data]);
}

function getScope(data, extra) {
	return {
		extra: extra,
		scopes: [{ scope: data, helpers: {}, level: { '@root': data } }],
	};
}

function getDeepData(data, mainVar, getParent) {
	for (var n = 0, l = mainVar.path.length; n < l; n++) {
		data = data[mainVar.path[n]];
		if (!data) return;
	}
	return getParent ? data : data[mainVar.value];
}

function getHelperData(_this, model, root) {
	var key = root.variable.root;
	var data = { key: key, value: _this.helpers[key], type: 'helper' };

	return getValue(_this, data, model, { vars: root.variable.vars }, null);
}

function getData(_this, model, tagData) {
	var root = tagData.root;
	var variable = root.variable;
	var scope = model.scopes && model.scopes[variable.parentDepth] || {};
	var scopeData = scope.scope || {};
	var key = variable.value;
	var helper = !root.isStrict && !root.isString && _this.helpers[key] || null;
	var partial = tagData.isPartial && _this.partials[key] || null;
	var tmp = '';
	var value = variable.root ? getHelperData(_this, model, root) :
		(root.isString && variable.name) || variable.isLiteral ? key :
			(tmp = getDeepData(scope.level || {}, variable)) !== undefined ? tmp :
				(tmp = getDeepData(scope.helpers || {}, variable)) !== undefined ? tmp :
					(tmp = getDeepData(scopeData, variable)) !== undefined ? tmp :
						helper || partial || (scopeData[key] !== undefined ? scopeData[key] :
							root.isString ? key : getDeepData(model.extra, variable));
	var type = value === undefined || value === null ? '' : helper ? 'helper' :
		partial ? 'partial' : value.constructor === Array ? 'array' : typeof value;

	return { value: value, type: type };
}

function getValue(_this, data, model, tagData, bodyFn) {
	return data.type === 'helper' || data.type === 'function' ?
		renderHelper(_this, data, model, tagData, [{ bodyFn: bodyFn }]) : data.value;
}

function collectValues(_this, data, model, vars, obj, arr, restore) {
	for (var n = vars.length, item = {}, key = '', scp = null, iVar = ''; n--;) {
		item = vars[n];
		iVar = item.variable;
		scp = !!iVar.root ? getValue(_this, data, model, iVar, null) : null;
		key = scp || !iVar.name ? ('$' + n) : iVar.name;
		if (iVar.name) restore[key] = obj[key];
		obj[key] = scp || getData(_this, model, { root: item }).value;
		arr.push(obj[key]);
		if (item.isAlias) model.scopes[0].level[key] = obj[key];
	}
	return { obj: obj, arr: arr, restore: restore };
}

function pushAlias(tagData, variable, obj, key, value) {
	if (tagData.root.isAlias) {
		obj[variable.name || variable.value] = value;
		if (key !== undefined) obj[tagData.root.aliasKey || '@key'] = key;
	}
	return obj;
}

// ---- render blocks/inlines helpers (std. HBS helpers)

function renderPartial(_this, data, model, tagData) {
	var helpers = model.scopes[0].helpers;
	var restore = collectValues(_this, data, model, tagData.vars, helpers, [], {});

	return [data.value(model), cloneObject(restore.restore, helpers)][0];
}

function renderHelper(_this, data, model, tagData, bodyFns) {
	return data.value.apply({
		name: tagData.root ? tagData.root.variable.value : '',
		scope: model.scopes[0].scope,
		rootScope: model.scopes[model.scopes.length - 1].scope,
		getBody: function () {
			return bodyFns[0] ? bodyFns[0].bodyFn(model) : '';
		},
		getData: function (key) {
			return getData(_this, model, { root: getVar(key) }).value;
		},
		escape: function (string) { return escapeHtml(string, _this, true) },
	}, collectValues(_this, data, model, tagData.vars, {}, [], {}).arr);
}

function renderIfUnless(_this, data, model, tagData, bodyFns, track) {
	var idx = 0;
	var item = bodyFns[idx];
	var cond = !tagData.helper || tagData.helper === 'if' ? true : false;
	var result = false;
	var value = getValue(_this, data, model, tagData, item.bodyFn);

	while (!(result = cond && !!value || !cond && !value) && bodyFns[idx + 1]) {
		item = bodyFns[++idx];
		cond = !item.helper || item.helper === 'if' ? true : false;
		data = item.root ? getData(_this, model, item) : { value: cond };
		value = getValue(_this, data, model, item, item.bodyFn);
	}
	track.fnIdx = idx;
	return result ? item.bodyFn(model) : '';
}

function renderEach(_this, data, model, tagData, bodyFns) {
	var out = '';
	var isArr = data.type === 'array';
	var _data = isArr ? data.value || [] : getObjectKeys(data.value || {});

	for (var n = 0, l = _data.length, key = ''; n < l; n++) {
		key = isArr ? n : _data[n];
		model.scopes = shiftScope(
			model.scopes,
			data.value[key],
			createHelper(n, key, l, isArr ? _data[n] : data.value[key], data.value),
			pushAlias(tagData, tagData.root.variable, {}, key, data.value[key]),
			!!n
		);
		out += bodyFns[0].bodyFn(model);
	}
	model.scopes.shift();
	return out;
}

function renderWith(_this, data, model, tagData, bodyFns) {
	var variable = tagData.root.variable;
	var scope0 = model.scopes[0];
	var level = cloneObject({ '.': data.value, 'this': data.value }, scope0.level);

	model.scopes = shiftScope(model.scopes, data.value, {
		'@parent': getDeepData(model.scopes[variable.parentDepth], variable, true),
	}, pushAlias(tagData, variable, level, undefined, data.value), false);
	return [bodyFns[0].bodyFn(model), model.scopes.shift()][0];
}

// ---- render blocks and inlines; delegations only

function render(_this, model, tagData, isBlock, out, renderFn, bodyFns, track) {
	return _this.options.renderHook ? _this.options.renderHook.call(
		_this, out, tagData, model, isBlock, track,
		tagData.root ? tagData.root.variable.value : '',
		model.scopes[0].level['@parent'] || model.scopes[0].scope,
		function () {
			return renderFn(_this, tagData, model,
				bodyFns || getData(_this, model, tagData), track)
		}) : out;
}

function renderInline(_this, tagData, model, data) {
	return data.value === undefined ? '' : tagData.isPartial ?
		renderPartial(_this, data, model, tagData) :
		escapeHtml(data.type === 'helper' || data.type === 'function' ?
			renderHelper(_this, data, model, tagData, []) : data.value,
			_this, data.type !== 'boolean' && data.type !== 'number' &&
		tagData.isEscaped);
}

function renderInlines(_this, tags, glues, blocks, model) {
	for (var n = 0, l = glues.length, out = ''; n < l; n++) {
		out += glues[n];
		if (!tags[n]) continue;
		out += tags[n].blockIndex > -1 ? blocks[tags[n].blockIndex](model) :
			render(_this, model, tags[n], false,
				renderInline(_this, tags[n], model, getData(_this, model, tags[n])),
				renderInline, null);
	}
	return out;
}

function renderBlock(_this, tagData, model, bodyFns, recursive) {
	var data = getData(_this, model, tagData);
	var helper = tagData.helper;
	var isIfUnless = helper === 'if' || helper === 'unless';
	var track = recursive || { fnIdx: 0 }; // track ifElese bodyFn
	var renderFn = data.type === 'helper' || data.type === 'function' && !helper ?
		renderHelper : isIfUnless || data.value === undefined ?
			renderIfUnless : helper === 'with' || !helper && data.type !== 'array' ?
				renderWith :
				renderEach;
	var value = renderFn(_this, data, model, tagData, bodyFns, track);

	return recursive ? value :
		render(_this, model, tagData, true, value, renderBlock, bodyFns, track);
}

// ---- parse (pre-render) helpers

function trim(text, start, end) {
	var regExp = !start && !end ? '' :
		!start ? '\\s*$' : !end ? '^\\s*' : '^\\s*|\\s*$';

	return regExp ? text.replace(new RegExp(regExp, 'g'), '') : text;
}

function getTrims(start, end) {
	return [start.indexOf('~') !== -1, end.indexOf('~') !== -1];
}

function convertValue(text, obj) {
	if (text.charAt(0) === '"' || text.charAt(0) === "'") {
		obj.isString = true;
		return text.substr(1, text.length - 2);
	}
	if (/\.|\|/.test(text)) obj.isStrict = true;
	return text === 'true' ? true : text === 'false' ?
		false : isNaN(text) || text === '' ? text : +text;
}

function cleanText(text, obj) {
	return text.replace(/^(?:this[/.]|\.\/)/, function ($) {
		if ($) obj.isStrict = true;
		return '';
	}).replace(/[[\]]/g, '');
}

function getActiveState(text) {
	return text.charAt(1) === '%' ? 2 : text.charAt(0) === '%' ? 1 : 0;
}

function splitVars(text, out) {
	if (!text) return out;
	text.replace(/\(.*?\)|(?:("|'|\|).*?\1)|\S+/g, function (match) {
		if (match) out.push(match);
	});
	return out;
}

function parsePath(text, name, string) {
	var isString = typeof text === 'string';
	var isDot = text === '.';
	var doOperate = isString && !isDot && !string;
	var parts = doOperate ? text.split('../') : [];
	var pathParts = doOperate ? parts.pop().split(/[.\/]/) : [text];

	if (parts[0] === '@') { // HBS transform
		pathParts[parts.length - 1] = parts[0] + pathParts[parts.length - 1];
	}
	return !isString ? { name: name, value: text, isLiteral: true, path: [] } : {
		name: name,
		value: pathParts.pop(),
		path: pathParts,
		parentDepth: parts.length,
	}
}

function getVar(item) {
	var split = [];
	var out = {
		variable: {},
		isAlias: false,
		aliasKey: '',
		isString: false,
		isStrict: false,
		active: 0,
	};

	item = cleanText(item, out).substr(out.active = getActiveState(item));
	if (item.charAt(0) === '(') {
		item = item.substr(1, item.length - 2);
		split = splitVars(item, []);
		return {
			variable: {
				root: split.shift(), vars: processVars(split, [], {}), path: []
			}
		};
	}
	split = item.split('='); // /([=!<>]+)/
	out.variable = split[1] ?
		parsePath(convertValue(split[1], out), split[0], out.isString) :
		parsePath(convertValue(split[0], out), '', out.isString);
	return out;
}

function processAlias(out, text) {
	var parts = text.replace(/\s*\|\s*/g, '').split(/\s+/);

	out.variable.name = parts[0];
	out.aliasKey = parts[1] || '';
	out.isAlias = true;
}

function processVars(vars, collection, root) {
	for (var n = 0, l = vars.length, out = root || {}; n < l; n++) {
		if (vars[n] === 'as') {
			processAlias(out, vars[++n]);
			continue;
		}
		out = getVar(vars[n]);
		collection.push(out);
	}
	return collection;
}

function getTagData(_this, root, vars, type, start, bodyFn) {
	var varsArr = splitVars(root + (vars ? ' ' + vars : ''), []);
	var _root = varsArr.shift() || '';
	var helper = /^(?:if|each|with|unless)$/.test(_root) ? _root : '';
	var active = getActiveState(_root = helper ? varsArr.shift() || '' : _root);

	return bodyFn && !_root ? { bodyFn: bodyFn } : {
		root: _root = getVar(_root.substr(active)),
		isPartial: type === '>',
		isEscaped: start.lastIndexOf(_this.options.tags[0]) < 1,
		helper: type === '^' ? 'unless' : helper,
		vars: processVars(varsArr, [], _root),
		active: active,
		bodyFn: bodyFn || null,
	};
}

// ---- sizzle inlines

function sizzleInlines(_this, text, blocks, tags, glues) {
	var parts = text.split(_this.inlineRegExp);

	for (var n = 0, l = parts.length, vars = '', trims = []; n < l; n += 5) {
		if (parts[2 + n] && /^(?:!|=)/.test(parts[2 + n])) continue;
		vars = parts[3 + n] || '';
		trims = getTrims(!n ? '' : parts[4 + n - 5], !vars ? '' : parts[1 + n]);
		glues.push(trim(parts[n], trims[0], trims[1]));
		vars && tags.push(vars.indexOf('-block-') !== -1 ?
			{ blockIndex: +vars.substr(8) } :
			getTagData(_this, vars, '', parts[2 + n] || '', parts[1 + n], null));
	}
	return function executeInlines(data) {
		return renderInlines(_this, tags, glues, blocks, data);
	}
}

// ---- sizzle blocks

function processBodyParts(_this, parts, blocks, mainStart, blkTrims, bodyFns) {
	for (var n = 0, l = parts.length, prev = false, trims = []; n < l; n += 4) {
		prev = trims[1] !== undefined ? trims[1] : blkTrims[0];
		trims = parts[1 + n] ? getTrims(parts[1 + n], parts[3 + n]) : [blkTrims[1]];
		bodyFns.push(getTagData(_this, parts[2 + n - 4] || '', '', '',
			n !== 0 ? parts[1 + n - 4] || '' : mainStart,
			sizzleInlines(_this, trim(parts[n], prev, trims[0]), blocks, [], [])));
	}
	return bodyFns;
}

function doBlock(_this, blocks, start, end, close, body, type, root, vars) {
	var closeParts = close.split(root);
	var tagData = getTagData(_this, root, vars, type || '', start, null);
	var bodyFns = processBodyParts(_this, body.split(_this.elseSplitter),
		blocks, start, getTrims(end, closeParts[0]), []);

	blocks.push(function executeBlock(model) {
		return renderBlock(_this, tagData, model, bodyFns);
	});
	return (start + '-block- ' + (blocks.length - 1) + closeParts[1]);
}

function sizzleBlocks(_this, text, blocks) {
	var replaceCb = function ($, start, type, root, vars, end, body, $$, close) {
		return type === '#*' ? _this.registerPartial(vars.replace(/['"]/g, ''),
			sizzleBlocks(_this, body, blocks)) && '' :
			doBlock(_this, blocks, start, end, close, body, type, root, vars);
	};

	while (text !== (text = text.replace(_this.sectionRegExp, replaceCb)));
	return sizzleInlines(_this, text, blocks, [], []);
}

}));

/**! @license blick v0.1.0; Copyright (C) 2018-2020 by Peter Dematté */
(function defineBlick(global, factory) {
if (typeof exports === 'object') module.exports =
	factory(global, require('schnauzer'));
else if (typeof define === 'function' && define.amd) define('blick',
	['schnauzer'], function (Schnauzer) { return factory(global, Schnauzer) });
else global.Blick = factory(global, global.Schnauzer);
}(this, function (global, Schnauzer, undefined) {
'use strict';

var saveWrapHtml = (function (search, tags) {
	for (var tag in tags) tags[tag] = document.createElement(tags[tag]);
	return function (htmlText, clone) {
		var tagName = ((htmlText || '').match(search) || [])[1];
		var helper = (tags[tagName] || tags['default']);

		if (clone) helper = helper.cloneNode();
		helper.innerHTML = htmlText || '';
		return helper;
	};
}(/<\s*(\w*)[\s\S]*?>/, {
	option: 'select',
	legend: 'fieldset',
	area: 'map',
	param: 'object',
	thead: 'table',
	tr: 'tbody',
	col: 'colgroup',
	td: 'tr',
	'default': 'div',
}));

var Blick = function (template, options) {
	this.version = '0.1.0';
	this.options = {
		registerProperty: function () { },
		forceUpdate: false,
		attributes: {
			value: setValue,
			disabled: setAttribute,
			checked: setAttribute,
			autocomplete: setAttribute,
			contenteditable: setAttribute,
			readonly: setAttribute,
			required: setAttribute,
			selected: setAttribute,
		},
	};
	this.schnauzer = {};
	this.dataDump = [];

	initBlick(this, options || {}, template);
};
var initBlick = function (_this, options, template) {
	for (var option in options) if (option === 'attributes') {
		for (var attr in options[option])
			_this.options[option][attr] = options[option][attr];
	} else {
		_this.options[option] = options[option];
	}
	_this.options.collector = {}; // cr
	options.renderHook = renderHook;
	options.forceUpdate = _this.options.forceUpdate;
	_this.schnauzer = new Schnauzer(template, options);
	_this.schnauzer.dataDump = [];
};

Blick.prototype = {
	render: function (data, extra) {
		return this.schnauzer.render(data, extra);
	},
	renderHTML: function (data, extra) {
		return resolveReferences(
			this,
			this.schnauzer.dataDump,
			saveWrapHtml(this.schnauzer.render(data, extra))
		);
	}
};

return Blick;

// --- attribute setter helpers

function setAttribute(element, name, value) {
	if (value === true || value === 'true' || (!value && value !== false)) {
		element.setAttribute(name, '');
		element[name] = true;
	} else {
		element.removeAttribute(name);
		element[name] = false;
		if (value === 'focus') element.focus();
	}
}

function setValue(element, name, value) {
	element.setAttribute('value', value);
	element.value = value;
}

// --- main delegators, api hooks and helpers

function findNode(container, pattern) {
	var NODE_TYPE = XPathResult.FIRST_ORDERED_NODE_TYPE;

	return document.evaluate('//text()[contains(., "' + pattern + '")]',
		container, null, NODE_TYPE, null).singleNodeValue ||
		document.evaluate('//@*[contains(., "' + pattern + '")]',
			container, null, NODE_TYPE, null).singleNodeValue;
}

function findEndNode(node, end$) {
	var children = node.parentNode.childNodes;

	for (var n = children.length, child = {}, index = 0, lastNode = null; n--;) {
		child = children[n];
		if (child.nodeType !== 3) continue;
		index = child.textContent.indexOf(end$);
		if (index === -1) continue;
		lastNode = child.splitText(index + end$.length);
		child.textContent = child.textContent
			.substring(0, child.textContent.length - end$.length);
		break;
	}
	return lastNode;
}

function findSatrtNode(node, start$) {
	node = node.splitText(node.textContent.indexOf(start$));
	node.textContent = node.textContent.substring(start$.length);
	return node;
}

function renderHook(out, tagData, model, isBlock, track, key, parent, bodyFn) {
	var index = this.dataDump.length;
	var longKey = tagData.root ? tagData.root.variable.path.join('.') + key : '';
	var obj = parent ? Object.getOwnPropertyDescriptor(parent, key) : null;
	var doScan = !!tagData.active || this.options.forceUpdate;
	var hasGetter = !!key && doScan && !!obj ? !!obj.get : false;

	if (!hasGetter) return out;
	this.dataDump.push({
		out: out, isBlock: isBlock, parent: parent, track: track, key: longKey,
		bodyFn: bodyFn, active: tagData.active, helper: tagData.helper,
		isEscaped: tagData.isEscaped,
	});

	return '{{#' + index + '}}' + out + '{{/' + index + '}}';
}

function resolveReferences(_this, dataDump, html) {
	var start$ = '';
	var end$ = '';
	var foundNode = null;
	var renderFn = null;

	for (var n = dataDump.length, dump = {}; n--;) { // must revers
		dump = dataDump.pop();
		start$ = '{{#' + n + '}}';
		end$ = '{{/' + n + '}}';
		foundNode = findNode(html, start$);
		renderFn = !foundNode ? null : foundNode.ownerElement ?
			attributeFn : !dump.isBlock ?
				inlineFn :
				blockFn;
		renderFn && renderFn(_this, foundNode, start$, end$, dump, dataDump);
	}
	return html;
}

// ---- attributes

function attributeFn(_this, node, start$, end$, dump, dataDump) {
	var ownerElement = node.ownerElement;
	var attrFn = _this.options.attributes[node.nodeName];
	var update = function (helper) {
		var parentNode = helper.parentNode;

		if (node._cache) setTimeout(function () { delete node._cache; });
		if (parentNode.nodeType === 11) return;
		if (attrFn) {
			return attrFn(ownerElement, node.nodeName, parentNode.textContent);
		}
		node.textContent = parentNode.textContent;
	};
	var wrap = node._cache = node._cache || saveWrapHtml(node.textContent, true);
	var helperNode = [].slice.call(wrap.childNodes).filter(function (item) {
		return item.textContent.indexOf(start$) !== -1; // TODO: optimise
	})[0];

	update(!dump.isBlock ?
		inlineFn(_this, helperNode, start$, end$, dump, dataDump, update) :
		blockFn(_this, helperNode, start$, end$, dump, dataDump, update));
}

// ---- inline / textNodes & ChildNodeList

function inlineFn(_this, node, start$, end$, dump, dataDump, update) {
	node = findSatrtNode(node, start$);

	_this.options.registerProperty(replaceInline(node, node.previousSibling,
		findEndNode(node, end$), dump.isEscaped, update),
		dump.key, dump.parent, dump.active
	);
	return node;
}

function replaceInline(node, firstNode, lastNode, isEscaped, update) {
	return function updateInline(data) {
		var childNodes = [];

		if (update || isEscaped) {
			node.textContent = data;
			update && update(node);
			return [];
		}
		childNodes = saveWrapHtml(data + '').childNodes;
		while (lastNode.previousSibling !== firstNode) {
			lastNode.parentNode.removeChild(lastNode.previousSibling);
		}
		for (var n = 0, l = childNodes.length; n < l; n++) {
			lastNode.parentNode.insertBefore(childNodes[0], lastNode);
		}
		return [];
	}
}

// ---- blocks / textNodes and HTMLElements

function blockFn(_this, node, start$, end$, dump, dataDump, update) {
	if (node.textContent.indexOf(end$) !== -1) { // flat structure
		node.splitText(node.textContent.indexOf(start$) + start$.length);
	}
	node = findSatrtNode(node, start$);

	_this.options.registerProperty(
		replaceBlock(_this, node, findEndNode(node, end$),
			dump.bodyFn, dump.track, dump.out, dataDump, update),
		dump.key,
		dump.parent,
		dump.active
	);
	return node;
}

function replaceBlock(
	_this, firstNode, lastNode, bodyFn, track, out, dataDump, update
) {
	var wasEverRendered = [];
	var fnIdx = track.fnIdx;
	var trackDF = [];

	trackDF[fnIdx] = document.createDocumentFragment();
	wasEverRendered[fnIdx] = out.length > 0;

	return function updateBlock(data) {
		var outContainer = [];
		var body = bodyFn(); // need for track.fnIdx
		var html = {};
		var node = firstNode;
		var prevFnIdx = fnIdx;

		fnIdx = track.fnIdx;
		while ((node = firstNode.nextSibling) && node !== lastNode) {
			trackDF[prevFnIdx].appendChild(node);
		}
		if (!wasEverRendered[fnIdx]) {
			trackDF[fnIdx] = trackDF[fnIdx] || document.createDocumentFragment();
			html = resolveReferences(_this, dataDump, saveWrapHtml(body));
			while (node = html.childNodes[0]) {
				outContainer.push(trackDF[fnIdx].appendChild(node));
			}
			wasEverRendered[fnIdx] = !!outContainer.length;
		}
		if (body) lastNode.parentNode.insertBefore(trackDF[fnIdx], lastNode);
		update && update(firstNode);
		if (dataDump.length) dataDump.splice(0, dataDump.length);

		return outContainer;
	};
}

}));

/**! @license VOM v0.2.0; Copyright (C) 2017-2018 by Peter Dematté */
(function (root, factory) {
if (typeof exports === 'object') { module.exports = factory(root) }
else if (typeof define === 'function' && define.amd) {
	define('VOM', [], function () { return factory(root) })
} else { root.VOM = factory(root) }
}(this, function (window, undefined) {
'use strict';

var VOM = function (model, options) {
	this.options = {
		parentCheck: false,
		idProperty: 'id',
		subscribe: function () { },
		enrichModelCallback: function () { },
		preRecursionCallback: function () { },
		moveCallback: function () { },
		listeners: [],
		forceEnhance: false,
		childNodes: 'childNodes',
		throwErrors: false
	};
	this.model = model || [];

	init(this, options || {});
},
	init = function (_this, options) {
		var rootItem = {},
			_options = _this.options;

		NODES.push({}); // new access map for current instance
		reinforceProperty(_this, 'id', NODES.length - 1);

		for (var option in options) { // extend options
			_options[option] = options[option];
		}
		_options.listeners = [];
		for (var n = (options.listeners || []).length; n--;) {
			if (!options.listeners[n]) continue;
			_options.listeners[n] = options.listeners[n].split(pathSplit);
		}
		if (_this.model.constructor !== Array) {
			_this.model = [_this.model];
			_this.standalone = true;
		}
		rootItem[_options.childNodes] = _this.model;
		if (!_this.standalone) {
			reinforceProperty(_this.model, 'root', rootItem);
		}
		enrichModel(_this, _this.model);
	},
	pathSplit = /\.|\//,
	NODES = [], // node maps for fast access
	idCounter = 0; // item id counter (if items have no own id)

VOM.prototype = {
	getElementById: function (id) {
		return NODES[this.id][id];
	},
	getElementsByProperty: function (property, value) {
		var result = [],
			isFn = typeof value === 'function',
			hasValue = undefined !== value,
			hasProperty = undefined !== property,
			keys = [],
			propValue = null,
			node = NODES[this.id];

		for (var id in node) {
			propValue = undefined !== node[id][property] ?
				node[id][property] : crawlObject(node[id], (keys[0] ?
					keys : (keys = hasProperty && property.split(pathSplit))));
			if ((hasValue && propValue === value || (isFn && value(propValue))) ||
				(!hasValue && undefined !== propValue) ||
				(!hasValue && !hasProperty)) {
				result.push(node[id]);
			}
		}
		return result;
	},
	appendChild: function (item, parent) {
		parent = parent || this.model.root;
		return moveItem(this, item, parent, getChildNodes(parent,
			this.options.childNodes).length, 'appendChild', parent);
	},
	prependChild: function (item, parent) {
		parent = parent || this.model.root;
		return moveItem(this, item, parent, 0, 'prependChild', parent);
	},
	insertBefore: function (item, sibling) {
		return moveItem(this, item, sibling.parentNode, sibling.index,
			'insertBefore', sibling);
	},
	insertAfter: function (item, sibling) {
		return moveItem(this, item, sibling.parentNode, sibling.index + 1,
			'insertAfter', sibling);
	},
	replaceChild: function (newItem, item) {
		var index = item.index,
			parentNode = item.parentNode;

		newItem !== item && removeChild(this, item);
		moveItem(this, newItem, parentNode, index, 'replaceChild', item);
		return item;
	},
	removeChild: function (item) {
		removeChild(this, item);
		this.options.subscribe.call(this, 'removeChild', item); // order of args
		return item;
	},
	sortChildren: function (callback, model, children) {
		model = (model || this.model).sort(callback);
		for (var n = 0, l = model.length; n < l; n++) {
			this.options.subscribe.call(this, 'sortChildren', model[n]);
			if (children && model[n][this.options.childNodes]) {
				this.sort(callback, model[n][this.options.childNodes], children);
			}
		}
	},
	addProperty: function (property, item, readonly) {
		return addProperty(this, property.split(pathSplit)[0],
			{ current: item, root: item }, property, readonly);
	},
	reinforceProperty: reinforceProperty,
	getProperty: function (property, item) {
		return crawlObject(item, property.split(pathSplit));
	},
	getCleanModel: function (item) { // maybe not...
		return JSON.parse(JSON.stringify(item || this.model));
	},
	destroy: function () {
		return destroy(this, this.model);
	}
};

VOM.getElementById = function (id) {
	var split = id.split(':');

	return NODES[split[0]] && NODES[split[0]][split[1]];
};

return VOM;

function crawlObject(data, keys) { // faster than while
	for (var n = 0, m = keys.length; n < m; n++) {
		if (keys[n] === '*') return data;
		data = data && data[keys[n]];
	}
	return data;
}

function destroy(_this, items) { // only cleans up NODES
	for (var n = items.length; n--;) {
		if (items[n][_this.options.childNodes]) {
			destroy(_this, items[n][_this.options.childNodes]);
		}
		delete NODES[_this.id][items[n][_this.options.idProperty]];
		items.pop();
	}
	return items;
};

function indexOf(_this, item) { // TODO: fix appendChild -> index
	return item.__index !== undefined ? item.__index :
		(item.parentNode ? getChildNodes(item.parentNode,
			_this.options.childNodes) : _this.model).indexOf(item);
};

function getChildNodes(item, childNodes) { // adds array if necessary
	item[childNodes] = item[childNodes] || [];
	return item[childNodes];
};

function moveItem(_this, item, parent, index, type, sibling) {
	var options = _this.options;
	var oldParent = item.parentNode;

	if (!item.parentNode) { // for convenience: append un-enhenced new items
		item.__index = index;
		enrichModel(_this, [item], parent, type, sibling);
	} else if (options.parentCheck) {
		parentCheck(item, parent, options);
	} // TODO: add more checks if allowed...

	_this.type = type;
	_this.sibling = sibling;

	if (item.parentNode === parent && index > item.index && item.index !== -1) {
		index--;
	}
	item = item.index !== -1 && item.parentNode &&
		removeChild(_this, item, true) || item;
	getChildNodes(parent, options.childNodes).splice(index || 0, 0, item);
	item.parentNode = parent;
	options.moveCallback.call(_this, item, type, sibling, oldParent);

	return item;
};

function removeChild(_this, item, preserve) {
	!preserve && destroy(_this, [item]);
	return getChildNodes(item.parentNode, _this.options.childNodes)
		.splice(item.index, 1)[0] || item; // if new
}

function parentCheck(item, parent, options) {
	var check = parent;

	if (item === parent) {
		error('ERROR: can\'t move element inside itself', options);
	}
	while (check = check.parentNode) {
		if (check === item) {
			error('ERROR: can\'t move parent inside it\'s own child', options);
		}
	}
};

function enrichModel(_this, model, parent, type, sibling) {
	var options = _this.options,
		isNew = false,
		hasOwnId = true,
		idProperty = options.idProperty,
		item = {};

	for (var n = 0, l = model.length; n < l; n++) {
		item = model[n];

		if (!item[idProperty] && !_this.standalone) { // TODO: cr-id="0:undefined"
			item[idProperty] = idCounter++;
			hasOwnId = false;
		}

		NODES[_this.id][item[idProperty]] = item; // push to flat index model
		isNew = !item.parentNode;
		if (!_this.standalone) {
			item.parentNode = parent || _this.model.root;
			item.index = item.index || 0; // will be reset on get()
		}
		if (isNew) {
			if (!_this.standalone) {
				reinforceProperty(item, idProperty, item[idProperty], hasOwnId);
				addProperty(_this, 'index', { current: item }, null, true);
				addProperty(_this, 'parentNode', { current: item }, null, true);
			}
			enhanceModel(_this, item, _this.options.listeners);
		}

		options.preRecursionCallback.call(_this, item, type, sibling);
		item[options.childNodes] && // recursion
			enrichModel(_this, item[options.childNodes], item);
		options.enrichModelCallback.call(_this, item, type, sibling);
		delete item.__index;
	}

	return model;
}

function addProperty(_this, property, item, path, readonly) {
	var cache = {};

	if (!_this.options.forceEnhance &&
		!item.current.hasOwnProperty(property)) return;
	cache[property] = item.current[property];
	return defineProperty(_this, property, item, cache, !readonly, path);
}

function enhanceModel(_this, model, listeners, recPath, recModel) {
	var listener = [],
		wildcardPos = 0,
		restPos = 0,
		path = '',
		deepModel = {},
		deepListener = [];

	for (var n = listeners.length; n--;) {
		listener = listeners[n]; // array of strings
		wildcardPos = listener.indexOf('*');
		path = (recPath || '') + listener.join('.');
		deepModel = recModel || crawlObject(model, listener);

		if (wildcardPos !== -1) {
			restPos = wildcardPos + 1;

			for (var item in deepModel) {
				if (item === 'childNodes') continue; // __index, parentNode
				if (restPos === listener.length) {
					addProperty(_this, item, { current: deepModel, root: model },
						path.replace('*', item));
				} else {
					deepListener = listener.slice(restPos);
					enhanceModel(_this, model, [listener.slice(restPos)],
						path.split('*')[0] + item + '.', crawlObject(deepModel[item],
							deepListener.slice(0, deepListener.length - 1)));
				}
			}
		} else {
			deepModel = listener.length !== 1 ?
				crawlObject(recModel || model, listener.slice(0, -1)) : model;
			addProperty(_this, listener[listener.length - 1],
				{ current: recModel ? recModel : deepModel, root: model }, path);
		}
	}
	return model;
}

function reinforceProperty(model, item, value, writeable, enumable) {
	delete model[item]; // in case it is set already...
	return Object.defineProperty(model, item, {
		enumerable: !!enumable,
		configurable: false,
		writable: writeable === undefined ? true : !!writeable,
		value: value
	});
}

function defineProperty(_this, prop, obj, cache, enumable, path) {
	return Object.defineProperty(obj.current, prop, {
		get: function () {
			return prop === 'index' ? indexOf(_this, obj.current) : cache[prop];
		},
		set: function (value) {
			validate((path || prop), obj, cache[prop],
				cache[prop] = value, cache, _this);
		},
		enumerable: enumable
	});
}

function validate(prop, obj, oldValue, value, cache, _this) {
	if (prop === _this.options.idProperty || prop === 'index' ||
		_this.options.subscribe.call(_this, _this.type ||
			prop, obj.root || obj.current, value, oldValue, _this.sibling)) {
		cache[prop] = oldValue; // return value if not allowed
		error('ERROR: Cannot set property "' + prop + '" to "' +
			value + '"', _this.options);
	}
	delete _this.type;
	delete _this.sibling;
}

function error(txt, options) {
	if (!options.throwErrors && window !== undefined && window.console) {
		return console.warn ? console.warn(txt) : console.log(txt);
	}
	throw txt;
}

}));

/**! @license CircularJS v1.0.0; Copyright (C) 2019 by Peter Dematté */
define('api', ['VOM', 'blick', 'toolbox'], function (VOM, Blick, Toolbox) {
return function addCircularAPI(inbound, Circular) {

var pubsub = {}; // general data holder
var modulesMap = {}; // list of modules for module switching
var prototype = {};

prototype.model = function (model, options) {
	return new VOM(model, options);
};

prototype.sendToComponent = function (name, data) {
	var component = this.getComponent(name);

	if (component && component.onSend) return component.onSend(data);
};

prototype.triggerEvent = function (type, data, params) {
	var event = {};
	var _params = params || {};

	_params.detail = data;
	event = new CustomEvent(type, _params);
	(_params.element || window).dispatchEvent(event, data);
}

prototype.installEvent = function (element, type, func, cap) {
	return Toolbox.addEvent(element || window, type, func, cap);
}

prototype.subscribeToComponent = function (name, prop, fn, trigger) {
	var _this = this;
	var component = this.getComponent(name);
	var id = component && component['__cr-id'];

	if (component) {
		this.subscribe(this.id, id, prop, fn, trigger);

		return function unsubscribe() { _this.unsubscribe(_this.id, id, prop, fn) };
	}
	return function () { };
};

prototype.destroyComponents = function (insts) {
	var _this = this;

	insts.forEach(function (inst) { _this.destroyComponent(inst) });
};

/* --------------------  pubsub  ----------------------- */

prototype.subscribe = function (inst, comp, attr, callback, trigger) {
	var _this = this;

	inst = inst ? inst.name || inst.components && inst.components[comp] || inst : this.name;
	pubsub[inst] = pubsub[inst] || {};
	comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
	comp[attr] = comp[attr] || [];
	if (callback) {
		// check also for routers
		comp[attr].push(callback.callback || callback);
		if (callback.regexp && !comp[attr].regexp) {
			comp[attr].regexp = callback.regexp;
			comp[attr].names = callback.names;
		}
	}
	if (!attr || !comp[attr]) {
		delete pubsub[inst];
		return;
	}
	if (trigger && comp[attr].value !== undefined) {
		(callback.callback || callback).call(this, comp[attr].value);
	}

	return function () { _this.unsubscribe(inst, comp, attr, callback) };
};

prototype.publish = function (inst, comp, attr, data) {
	inst = typeof inst === 'string' ? inst : this.name;
	pubsub[inst] = pubsub[inst] || {};
	if (pubsub[inst]) {
		comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
		comp[attr] = comp[attr] || [];
		comp[attr].value = data;
		comp[attr][0] && publish(this, comp[attr], data);
	}
};

prototype.unsubscribe = function (inst, comp, attr, callback) {
	var funcNo = -1,
		funcs = {};

	inst = typeof inst === 'string' ? inst : inst.name || this.name;
	if (pubsub[inst] && pubsub[inst][comp] && pubsub[inst][comp][attr]) {
		funcs = pubsub[inst][comp][attr];
		funcNo = funcs.indexOf(callback.callback || callback);
		if (funcNo !== -1) {
			funcs.splice(funcNo, 1);
		}
	}
	return (callback.callback || callback);
};

function publish(_this, pubsubs, data) {
	for (var n = 0, m = pubsubs.length; n < m; n++) {
		if (pubsubs[n]) pubsubs[n].call(_this, data);
	}
}

/* ----------------------- routing -------------------------- */

prototype.addRoute = function (data, trigger, hash) {
	var _this = this,
		path = typeof data.path === 'object' ?
			{ regexp: data.path } : routeToRegExp(data.path),
		_hash = hash || this.options.hash,
		parts = extractRouteParameters(path, getPath(_hash)),
		routers = pubsub[this.name] && pubsub[this.name].__router,
		uninstall = {};

	this.subscribe(null, '__router', data.path, {
		callback: data.callback,
		names: path.names,
		regexp: path.regexp || path
	}, trigger);

	if (trigger && parts) {
		data.callback.call(this, parts);
	}
	uninstall = !routers && installRouter(pubsub[this.name].__router, this, _hash);
	return function () {
		_this.removedRoute(data);
		!routers && uninstall();
	};
};

prototype.removedRoute = function (data) {
	return this.unsubscribe(null, '__router', data.path, data.callback);
};

prototype.toggleRoute = function (data, isOn) {
	var router = pubsub[this.name].__router,
		callbacks = router[data.path].paused || router[data.path];

	router[data.path] = isOn ? callbacks : [];
	router[data.path].paused = !isOn ? callbacks : null;
};

function installRouter(routes, _this, hash) {
	var event = window.onpopstate !== undefined ? 'popstate' : 'hashchange';

	return Toolbox.addEvent(window, event, function (e) {
		var parts = {};

		for (var route in routes) {
			parts = extractRouteParameters(routes[route], getPath(hash));
			parts && publish(_this, routes[route], parts);
		}
	}, _this.id);
}

function getPath(hash) {
	return decodeURI(hash ? location.hash.substr(hash.length) :
		location.pathname + location.search);
}

function routeToRegExp(route) {
	var names = [];

	route = route.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&') // escape
		.replace(/\((.*?)\)/g, '(?:$1)?') // optional
		.replace(/(\(\?)?:\w+/g, function (match, optional) { // named
			names.push(match.substr(1));
			return optional ? match : '([^/?]+)';
		})
		.replace(/\*/g, '([^?]*?)'); // splat

	return {
		regexp: new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$'),
		names: names
	}
}

function extractSearchString(query) {
	query = query ? query.split('&') : [];
	for (var n = 0, m = query.length, out = {}, parts = []; n < m; n++) {
		parts = query[n].split('=');
		out[parts[0]] = parts[1];
	}
	return out;
}

function extractRouteParameters(route, fragment) {
	var params = route.regexp && route.regexp.exec(fragment),
		names = {};

	if (!params) return null;

	params = params.slice(1);

	for (var n = 0, m = params.length; n < m; n++) {
		params[n] = params[n] ? (n === m - 1 ? params[n] :
			decodeURIComponent(params[n])) : null;
		route.names[n] && (names[route.names[n]] = params[n]);
	}
	params.parameters = names;
	params.queries = extractSearchString(params[m - 1]);
	params.path = fragment.replace(/^\//, '').split('/');
	return params;
}

/* ----------------------- template ------------------------- */

prototype.template = function (template, options) {
	options = options || {};
	options.helpers = options.helpers || this.options.helpers;
	var engine = new Blick(template, options);
	if (options.share) {
		for (var partial in engine.schnauzer.partials) {
			if (!this.options.partials[partial] && partial !== 'self') {
				this.options.partials[partial] = engine.schnauzer.partials[partial];
			}
		}
	}
	return engine;
};

/* ------------------- resource loader -------------------- */

prototype.renderModule = function (data) {
	var isValid = data.require && data.container;
	var container = isValid && typeof data.container === 'string' ?
		Toolbox.$(data.container) : data.container;
	var item = modulesMap[(data.context || '') + data.require];
	var _this = this;

	if (!isValid) return new Promise(function () { });

	if (item) {
		return new Toolbox.Promise(function (resolve) {
			appendChildToContainer(item.element, container, data.transition);
			if (item.instance && item.instance.onLoad) item.instance.onLoad(item.element, _this);
			resolve(item);
		});
	}

	return new Toolbox.Promise(function (resolve) {
		require([data.path || data.require], function (module) {
			var componentElm = document.createElement(module.selector);
			var setAttribute = componentElm.setAttribute.bind(componentElm);
			data.input && setAttribute('cr-input', data.input);
			data.event && setAttribute('cr-event', data.event);
			data.name && setAttribute('cr-name', data.name);
			var instance = !module.instance && module.init(componentElm, null, data.this);
			var item = module.instance || instance;

			appendChildToContainer(componentElm, container, data.transition);
			if (item && item.onLoad) item.onLoad(componentElm, _this);
			resolve(modulesMap[(data.context || '') + data.require] = !module.instance ? {
				element: componentElm,
				instance: instance,
			} : module);
		});
	});
};

function appendChildToContainer(element, container, transition) {
	if (transition) {
		return transition(function remove() {
			if (container.children[0]) {
				container.removeChild(container.children[0]);
			}
		}, function append() {
			container.appendChild(element);
		});
	}
	if (container.children[0]) {
		container.replaceChild(element, container.children[0]);
	} else {
		container.appendChild(element);
	}
}

/* ---------------------------------------------------------- */

Object.defineProperties(Circular, { // static
	Toolbox: { value: Toolbox },
	instance: { value: new Circular() },
});

for (var key in prototype) { // methods
	inbound[key] = { value: prototype[key] };
}

return inbound;

}});

define('controller', ['toolbox', 'VOM'], function (Toolbox, VOM) {
'use strict';

var keys = Toolbox.keys;

function Controller(options) {
	this.options = { element: document.body };
	this.events = {};

	for (var option in options) {
		this.options[option] = options[option];
	}
}

Controller.prototype = {
	installEvent: function (instance, element, eventName, items) {
		var componentElement = this.options.element;
		var parts = eventName.split('!');
		var name = parts[2] || parts[1] || parts[0];
		var useCapture = parts[2] ? true : parts[1] ? false :
			/(?:focus|blur|mouseenter|mouseleave)/.test(name) ? true : false;

		if (this.events[name]) return;

		this.events[name] = Toolbox.addEvent(element, name, function (e) {
			eventDelegator(e, instance, items, componentElement, VOM.getElementById);
		}, useCapture);
	},
	installEvents: function (instance, element, events, items) {
		var _this = this;

		keys(events).forEach(function (key) {
			_this.installEvent(instance, element, key, items);
		});
	},
	removeEvent: function (eventName) {
		if (this.events[eventName]) {
			this.events[eventName]();
			delete this.events[eventName];
		}
	},
	removeEvents: function (events) {
		events.forEach(this.removeEvent.bind(this));
	},
	destroy: function () {
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
	events[e.type][key].forEach(function (eventElement) {
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

	(modelHasEvents ? events : rootItems && rootEvents || []).forEach(function (key) {
		triggerEvent(instance, modelEvents, model || rootItems, key, e, sP);
	});

	element !== componentElement && modelHasEvents && rootEvents.forEach(function (key) {
		triggerEvent(instance, rootItems.events, rootItems, key, e, sP);
	});
}

});

/**! @license CircularJS ● v1.3.0; Copyright (C) 2019 by Peter Dematté */
define('circular', ['toolbox', 'blick', 'VOM', 'api', 'controller'],
function (Toolbox, Blick, VOM, mixinAPI, Controller) {
'use strict';

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var $create = Toolbox.$create;
var isArray = Toolbox.isArray;
var keys = Toolbox.keys;
var id = 0;
var components = {};
var instances = {};
var templateWrapper = $create('div');

function Circular(name, options) {
	this.options = {
		hash: '#',
		partials: {},
		helpers: {},
		decorators: {},
	};

	initCircular(this, name, options || {});
}

function initCircular(_this, name, options) {
	var isName = typeof name === 'string';

	if (!isName) {
		options = name || {};
	}
	for (var option in options) {
		_this.options[option] = options[option];
	}
	_this.version = '1.3.0';
	_this.id = 'cr_' + id++;
	_this.name = isName ? name : _this.id;
	instances[_this.id] = {};
}

Object.defineProperties(Circular.prototype, mixinAPI({
	getComponent: {
		value: function (name) {
			var data = instances[this.id][name];

			return data && data.instance;
		}
	},
	destroyComponent: {
		value: function (inst) {
			var id = inst['__cr-id'].split(':');
			var data = instances[id[0]][id[1]];
			var instance = data.instance;

			instance.onDestroy && instance.onDestroy();
			for (var key in instance) if ( // removes collectors, rendering, ...
				instance[key] &&
				instance.hasOwnProperty(key) &&
				isArray(instance[key])) instance[key] = [];
			data.controller.removeEvents(keys(data.controller.events));
			data.models.forEach(function (model) { model.destroy() });
			data.subscribers.forEach(function (unsubscribe) { unsubscribe() });
			for (var key in data) data[key] = null;

			delete instances[id[0]][id[1]];
		}
	},
	destroy: {
		value: function () {
			var insts = instances[this.id];

			this.destroyComponents(keys(insts).map(function (key) {
				return insts[key].instance;
			}));
		}
	},
	getAttributeData: { value: getAttrMap },
}, Circular));

return Object.defineProperties(Circular, {
	Module: {
		value: function (defData, Klass) {
			var elm = $(defData.selector, defData.context);
			var component = Circular.Component(defData, Klass);

			return {
				component: component,
				instance: component.init(elm, null, getParentComponent(elm)),
				element: elm,
			};
		}
	},
	Component: {
		value: function (defData, Klass) {
			defData.plugins = {};
			defData.components = {};

			return components[defData.selector] || (components[defData.selector] = {
				Klass: Klass,
				selector: defData.selector,
				templates: defData.template && processTemplate(templateWrapper, defData),
				styles: installStyles(defData.selector, defData),
				name: defData.name || Klass.name,
				init: function init(element, plugData, parent) {
					var elm = typeof element === 'string' ? $(element) : element;

					return initComponent(elm, defData, Klass, plugData, parent);
				},
				preparePlugin: function preparePlugin(element, pData, values) {
					var plug = pData.plugins[defData.selector] = pData.plugins[defData.selector] || {};
					var where = plug[values.where] = plug[values.where] || {};
					var model = where[values.modelName] = where[values.modelName] || [];

					model.push(values.value);
					preparePluginInTemplate(element, defData);
				},
			});
		}
	},
	Plugin: {
		value: function (defData, Klass) {
			return Circular.Component(defData, Klass);
		}
	},
});

/* -------------------- private functions ------------------- */

function initComponent(element, defData, Klass, plugData, parent) {
	var selector = defData.selector;
	var component = components[selector];
	var items = {};
	var name = '';
	var instance = {};
	var inst = {};
	var crInst = defData.circular || Circular.instance;
	var controller = {};
	var models = [];
	var templates = component.templates || {};
	var elmId = element.getAttribute('cr-id');
	var elmName = element.getAttribute('cr-name');

	if (elmId && !plugData) {
		return instances[crInst.id + ':' + elmId];
	}
	['partials', 'helpers', 'decorators', 'attributes'].forEach(function (key) {
		if (!defData[key]) defData[key] = crInst.options[key];
	});
	items = {
		'cr-id': !plugData && (element.setAttribute('cr-id', crInst.id + ':' + id), id) || id,
		elements: { element: element },
		events: {},
		parentNode: {},
		views: {},
	};
	name = items['cr-id'];
	inst = instances[crInst.id][name] = {
		instance: {}, // for overwrite
		controller: {}, // for overwrite
		models: [], // for overwrite
		parent: '', // for overwrite
		subscribers: [],
	};
	if (elmName) { // getComponent() by name possible
		instances[crInst.id][elmName] = instances[crInst.id][name];
	}
	instance = inst.instance =
		getInstance(Klass, element, crInst, id++, plugData, defData, inst, parent);
	Object.defineProperty(instance, '__cr-id', { value: crInst.id + ':' + name });
	!plugData && initInner(element, instance, defData, name); // TODO: check setNewItem
	controller = inst.controller = new Controller({ element: element });
	models = keys(templates).concat(keys(defData.subscribe$));
	inst.models = models.filter(function (item, idx) { return models.indexOf(item) === idx })
		.sort(function (a) { return a === 'this' ? -1 : 1 })
		.map(function (key) {
			var tmpl = templates[key];
			return key ? applyModel({
				instance: instance,
				items: items,
				defData: defData,
				template: !plugData && tmpl && tmpl.template,
				childTemplate: !plugData && tmpl && tmpl.child,
				templateContainer: !plugData && key !== 'this' && tmpl ?
					getParent(element, tmpl.container) : element,
				modelName: key,
				listeners: defData.subscribe$ && defData.subscribe$[key],
				crInstance: crInst,
				controller: controller,
			}) : null;
		});
	if (!plugData && !defData.template) processStandalone(element, defData, items, inst);

	element.removeAttribute('cr-cloak');
	instance.onInit && instance.onInit(element, crInst, items);

	return instance;
}

function initInner(element, instance, defData, name) {
	getAttrMap(element, 'cr-plugin', function (key, value, element) {
		if (components[key]) {
			components[key].init(element, value, instance);
			delete defData.plugins[key];
			element.removeAttribute('cr-plugin');
		}
	});
	for (var n = element.children.length, tag = '', child = {}; n--;) {
		child = element.children[n];
		tag = child.tagName.toLowerCase();
		components[tag] && components[tag].init(child, null, instance);
	};
}

/* -------------- scoping ------------ */

function getInstance(Klass, element, crInst, instId, plugData, defData, inst, parentComp) {
	var rootItem = isArray(parentComp) ? parentComp[0] : parentComp;
	var loopItem = parentComp && parentComp[1];
	var isLoop = false;
	var data = plugData || element.getAttribute('cr-input');
	var parentValues = processInput(data, inst.parent = rootItem) || {};
	var parentId = rootItem && rootItem['__cr-id'].split(':')[1];

	element.removeAttribute('cr-input');

	return new Klass(element, crInst, function (scope, subscribe) {
		for (var key in parentValues.vars) if (key !== 'null') {
			scope[key] = typeof parentValues.vars[key] === 'function' ?
				parentValues.vars[key].bind(rootItem) : parentValues.vars[key];
		}
		if (subscribe !== false) {
			for (var key in parentValues.origin) {
				if (parentValues.static[key] || key === 'null') continue;
				isLoop = key === 'this' || key === '.';
				if (isLoop) {
					scope[parentValues.names[key]] = loopItem;
					// continue; // TODO: check if subscription is possible
				}
				instances[crInst.id][instId].subscribers.push((function (names, key) {
					return crInst.subscribeToComponent(
						isLoop ? loopItem['cr-id'] : parentId,
						key,
						function (value) { scope[names[key]] = value },
						true
					);
				})(parentValues.names, key));
			}
		}
		plugData && rootItem !== loopItem && installEvents(rootItem, scope, defData);
	}, function () { return rootItem || loopItem });
}

function installEvents(parent, scope, defData) {
	var events = defData.events || {};

	for (var key in events) {
		if (!parent['pl-' + events[key]]) (function (event) {
			Object.defineProperty(parent, 'pl-' + event, {
				value: function (e, elm, item) {
					return scope[event](e, elm, item);
				}
			});
		})(events[key]);
	}
}

function processInput(input, parent) {
	var vars = input && input.split(/\s*,\s*/) || [];
	var name = [];
	var out = { vars: {}, origin: {}, names: {}, static: {} };
	var isStatic = false;
	var staticValue = '';
	var key = '';

	for (var n = vars.length; n--;) {
		name = vars[n].split(/\s+as\s+/);
		isStatic = name[0].charAt(0) === '\'' || name[0].charAt(0) === '"';
		staticValue = isStatic ? Toolbox.convertToType(name[0].replace(/'|"/g, '')) : '';
		key = isStatic ? staticValue : name[0];

		out.vars[name[1] || key] = isStatic ? staticValue : parent[key];
		out.origin[key] = isStatic ? staticValue : parent[key];
		out.names[key] = name[1] || key;
		out.static[key] = isStatic;
	}
	return out;
}

function getParentComponent(elm) {
	var parent = elm.closest('[cr-id|="cr_"]');
	var ids = parent && parent.getAttribute('cr-id').substr(3).split(':');
	var out = ids && instances['cr_' + ids[0]][ids[1]];

	return out && out.instance || out;
}

/* -------------- plugins ------------ */

function preparePluginInTemplate(element, defData) {
	var events = element.getAttribute('cr-event');
	var all = events ? [events] : [];

	for (var key in defData.events) {
		all.push(key + ': pl-' + defData.events[key]);
	}
	element.setAttribute('cr-event', all.join('; '));
}

function initPlugins(key, value, element, inst) {
	var elms = [].slice.call($$('[cr-plugin*="' + key + '"]', element));

	for (var n = 0, m = elms.length; n < m; n++) {
		components[key].init(elms[n], value.join(','), inst[0] || inst[1]);
		elms[n].removeAttribute('cr-plugin');
	}
}

/* ---------------------------------------------------------- */

function processStandalone(element, defData, items, inst) {
	var selectors = keys(defData.components).join(',');
	var inner = selectors ? $$(selectors, element) : [];
	var restore = inner.length ? removeInnerComponents(inner, element) : function () { };

	items.views = getViewMap(element, function (elm) { });
	items.events = getAttrMap(element, 'cr-event', function (eventName) {
		inst.controller.installEvent(inst.instance, element, eventName, items);
	});
	restore();
}

function getParent(element, attr) {
	var parent = attr !== undefined && $('[cr-parent-container="' + attr + '"]', element);

	if (parent) {
		parent.removeAttribute('cr-parent-container');
	}
	return parent || element;
}

function applyModel(data) {
	var vom = getVOMInstance(data);

	if (data.modelName === 'this' || !isArray(data.instance[data.modelName]))
		return vom;

	for (var key in VOM.prototype) {
		Object.defineProperty(vom.model, key, { value: vom[key].bind(vom) });
	}
	Object.defineProperty(data.instance, data.modelName, {
		get: function () { return vom.model },
		set: function (newModel) {
			// window.requestAnimationFrame(function() {
			injectNewModel(vom, vom.model, newModel, newModel.isDelta);
			// });
		},
	});

	return vom;
}

function injectNewModel(vom, model, newModel, deltaOnly) {
	for (var n = 0, m = newModel.length; n < m; n++) {
		if (model[n]) {
			updateModelItem(vom, model[n], newModel[n]);
		} else { // if (!deltaOnly)
			vom.appendChild(newModel[n], model.parentNode || model[0] && model[0].parentNode);
		}
	}
	if (deltaOnly) return;
	while (model.length > newModel.length) vom.removeChild(model[model.length - 1]);
}

function setDeepObj(item, newItem, key) {
	if (Object.getOwnPropertyDescriptor(item, key).get) {
		for (var n in item[key]) {
			item[key][n] = typeof newItem[key][n] === 'object' ?
				setDeepObj(item[key], newItem[key], n) :
				newItem[key][n];
		}
		return item[key];
	} else {
		return newItem[key];
	}
}

function updateModelItem(vom, item, newItem) {
	for (var key in newItem) {
		if (key !== 'childNodes') {
			item[key] = typeof item[key] === 'object' ?
				setDeepObj(item, newItem, key, vom) : newItem[key];
		}
	}
	if (newItem.childNodes) {
		injectNewModel(vom, item.childNodes, newItem.childNodes);
	}
}

function getVOMInstance(data) {
	var inst = data.instance;
	var name = data.modelName;
	var name$ = name + '$';
	var name$$ = name + '$$';
	var name$PR = name + '$PR';

	return new VOM(name === 'this' ? inst : inst[name] || [], {
		idProperty: 'cr-id',
		moveCallback: inst[name + '$Move'] || function () { },
		enrichModelCallback: inst[name + '$Enrich'] || function () { },
		listeners: data.listeners,
		preRecursionCallback: function (item, type, siblPar) {
			inst[name$PR] && inst[name$PR](this, item);
			data.template &&
				setNewItem(this, { item: item, type: type, siblPar: siblPar, data: data });
		},
		subscribe: function (property, item, value, oldValue, sibling) {
			var intern = property === 'childNodes' || !!VOM.prototype[property];

			data.template && changeItem(this, property, item, value, oldValue, sibling, data);
			inst[name$] && !intern && inst[name$](property, item, value, oldValue);
			inst[name$$] && inst[name$$](property, item, value, oldValue, intern);
			!intern && data.crInstance.publish(data.crInstance.id, inst['__cr-id'], property, value);
		},
	});
}

function getHelperData(item, extra) {
	var parent = item.parentNode;
	var index = item.index;

	if (!parent) return extra;
	extra['@last'] = parent.childNodes.length - 1 === index;
	extra['@first'] = index === 0;
	extra['@index'] = index;
	extra['@counter'] = index + 1;
	return extra;
}

function setNewItem(vomInstance, param) {
	var item = param.item;
	var data = param.data;
	var rootElement = data.items.elements.element;
	var instContainer = data.templateContainer;
	var define = vomInstance.reinforceProperty;
	var isChild = !item.childNodes && !!data.childTemplate;
	var template = isChild ? data.childTemplate : data.template;
	var extraModel = getHelperData(item, data.defData.extraModel || {});
	var fragment = template && template.renderHTML(item, extraModel);
	var parentElements = item.parentNode && item.parentNode.elements;
	var tmpParent = parentElements && parentElements.container || instContainer;
	var parent = isChild ? tmpParent.lastElementChild : tmpParent;
	var sibling = param.siblPar && param.siblPar.elements && param.siblPar.elements.element;
	var isNew = item.__index !== undefined && !item.childNodes;
	var element = !fragment ? instContainer : !isNew ?
		render(fragment.children[0], param.type, parent, sibling, true) : fragment.children[0];
	var container = isChild ? parent :
		element.hasAttribute('cr-mount') ? element : $('[cr-mount]', element);

	if (!element.hasAttribute('cr-id')) {
		element.setAttribute('cr-id', vomInstance.id + ':' + (item['cr-id'] || 0));
	}
	if (instContainer !== rootElement) {
		define(item, 'elements', { element: element, container: container });
		define(item, 'views', getViewMap(element, function (elm) { }));
		define(item, 'events', getAttrMap(element, 'cr-event', function (eventName) {
			data.controller.installEvent(data.instance, rootElement, eventName);
		}));
	} else {
		var component = components[element.tagName.toLowerCase()];
		if (component) {
			element.removeAttribute('cr-id');
			component.init(element, null, data.instance);
		} else {
			processStandalone(rootElement, data.defData, data.items, {
				instance: data.instance,
				controller: data.controller,
			});
		}
	}
	initComponentsAndPlugins(element, data.defData, data.modelName, isChild, [data.instance, item]);

	return element;
}

function initComponentsAndPlugins(element, defData, modelName, isChild, instance) {
	var componentsDefs = defData.components;
	var plugins = defData.plugins;
	var isMain = modelName === 'this';
	var isLoop = !isMain && !isChild;
	var what = isMain ? 'main' : isLoop ? 'loop' : isChild ? 'child' : '';
	var insts = [];
	var inst = {};
	// components
	for (var key in componentsDefs) {
		if (what && componentsDefs[key][what][modelName]) {
			[].slice.call($$(key, element)).forEach(function (elm) {
				inst = components[key].init(elm, null, instance);
				inst && insts.push(inst);
			});
		}
	}
	// plugins
	for (var key in plugins) {
		if (what && plugins[key][what] && plugins[key][what][modelName]) {
			initPlugins(key, plugins[key][what][modelName], element, instance);
		}
	}
	return insts;
}

function changeItem(vomInstance, property, item, value, oldValue, sibling, data) {
	var element = item.elements && item.elements.element;
	var parentElements = item.parentNode && item.parentNode.elements || null;
	var parentElement = parentElements ? // TODO: check again
		parentElements.container || parentElements.element : data.templateContainer;
	var id = item['__cr-id'] || item['cr-id'];
	var template = !item.childNodes && data.childTemplate || data.template || null;
	var collector = template ? template.options.collector : {};
	var intern = property === 'childNodes' || !!VOM.prototype[property];

	if (property === 'removeChild') {
		render(element, property, element.parentElement);
		destroyCollector(collector, id);
	} else if (property === 'sortChildren') {
		render(element, 'appendChild', parentElement);
	} else if (vomInstance[property]) {
		if (item === sibling) { // replaceChild by itself;
			setNewItem(vomInstance, { item: item, type: property, siblPar: sibling, data: data });
		} else if (property !== 'replaceChild' && element && intern) {
			render(element, property, parentElement, sibling.elements && sibling.elements.element);
		}
	}

	changeBlickItems(data, item, collector, id, property, value, oldValue);
	// TODO: check if following line is ever needed
	// for (var key in data.defData.helpers) {
	//   changeBlickItems(data, item, collector, id, key, value, oldValue);
	// }
}

function destroyCollector(collector, id, keep) {
	var fn = function (item) { collector[id][item] = null };

	if (!collector || !collector[id]) return;
	// for (var item in collector[id]) delete collector[id][item];
	// if (!keep) delete collector[id];
	for (var item in collector[id]) fn(item);
	if (!keep) collector[id] = null;
}

function changeBlickItems(data, item, collector, id, property, value, oldValue) {
	var blickItems = collector && collector[id] && collector[id][property];
	var blickItem = {};
	var components = {};

	if (!blickItems) return;

	for (var n = blickItems.length, elm; n--;) {
		blickItem = blickItems[n];
		components = blickItem.components;
		if (value === oldValue && !blickItem.forceUpdate) continue;
		elm = blickItem.fn(value);

		if (data.controller && elm) for (var m = elm.length; m--;) {
			if (elm[m].nodeType !== 1) continue;
			getAttrMap(elm[m], 'cr-event', function (eventName, fnName) {
				var elms = (item.events || data.items.events)[eventName];

				if (!elms) {
					elms = item.events[eventName] = {};
					data.controller.installEvent(data.instance, data.instance.element, eventName);
				}
				if (!elms[fnName]) {
					elms[fnName] = [elm[m]];
				} else {
					elms[fnName].filter(function (elm, idx) {
						if (!data.items.elements.element.contains(elm)) {
							elms[fnName].splice(idx, 1);
						}
					});
					elms[fnName].push(elm[m]);
				}
			});
		}
		if (components) {
			data.crInstance.destroyComponents(components);
			blickItem.components = null;
		}
		if (elm && elm.length) {
			// TODO: check what this really does...
			for (var x = 0, y = elm.length; x < y; x++) {
				// TODO: remove !elm[x].isConnected elements; IE...
				if (elm[x].nodeType !== 1) continue;
				blickItem.components = initComponentsAndPlugins(
					elm[x].parentNode, // TODO: not parentNode...
					data.defData,
					data.modelName,
					false, // TODO: isChild,
					[data.instance, item]
				);
			}
		}
	}
}

function render(html, operator, parentNode, sibling, created) { // TODO: created
	if (operator === 'prependChild') {
		operator = 'insertBefore';
		sibling = parentNode.children[0];
	} else if (operator === 'insertAfter') {
		if (sibling.nextElementSibling) {
			operator = 'insertBefore';
			sibling = sibling.nextElementSibling;
		} else {
			operator = '';
		}
	}
	parentNode[operator || 'appendChild'](html, sibling);

	return html;
}

function installStyles(selector, options) {
	if (!options.styles) return;

	var link = $create('style');
	link.setAttribute('name', selector);
	link.innerHTML = '\n' + options.styles + '\n'; // TODO: sourceURL
	document.head.appendChild(link);

	return link;
}

function getInnerComponents(selectors, result, context, fn) {
	var wishList = selectors.join(',');
	var elms = wishList ? [].slice.call($$(wishList, context || document)) : [];

	for (var n = elms.length, elm = {}; n--;) {
		if (!elms[n]) continue;
		elm = elms[n];
		for (var m = elms.length; m--;) {
			if (elm !== elms[m] && elm.contains(elms[m])) {
				elms.splice(m, 1);
			}
		}
	}
	for (var n = elms.length; n--;) {
		result.push(elms[n]);
		if (fn) fn(elms[n], elms[n].tagName.toLowerCase());
	}

	return result;
}

function registerBlickProperty(fn, key, parent, active) {
	var collector = this.collector || {};
	var id = parent['__cr-id'] || parent['cr-id'];
	var blickItem = collector[id] = collector[id] || {};

	blickItem[key] = blickItem[key] || [];
	blickItem[key].push({ fn: fn, forceUpdate: active === 2 });
}

function getTemplate(template, defData, where, modelName) {
	if (!template) return null;
	template.parentNode && template.parentNode.removeChild(template);
	template.removeAttribute('cr-for');
	template.removeAttribute('cr-child');

	getAttrMap(template, 'cr-plugin', function (key, value, element) {
		components[key] && components[key].preparePlugin(element, defData, {
			where: where,
			modelName: modelName,
			value: value || 'null',
		});
	});

	if (!components[template.tagName.toLowerCase()]) {
		getInnerComponents(keys(components), [], template, function (element, key) {
			var component = defData.components[key] = defData.components[key] ||
				{ main: {}, loop: {}, child: {} };

			component[where][modelName] = true;
		});
	}

	return new Blick(template.outerHTML.replace(/(?:{{&gt;|cr-src=)/g, function ($1) {
		return $1.charAt(0) === '{' ? '{{>' : 'src=';
	}), {
		helpers: defData.helpers || {},
		partials: defData.partials || {},
		attributes: defData.attributes || {},
		registerProperty: registerBlickProperty,
	});
}

function processTemplate(element, defData) {
	var _ = element.innerHTML = defData.template || ''; // TODO: fragment...
	var templates = $$('[cr-for]', element);
	var result = {};

	templates.forEach(function (elm, idx) {
		var child = $('[cr-child]', elm);
		var modelName = elm.getAttribute('cr-for');
		var attr = modelName + idx;

		result[modelName] = {
			container: attr,
			child: child ? getTemplate(child, defData, 'child', modelName) : null,
			template: getTemplate(createPlaceHolder(elm, attr), defData, 'loop', modelName),
		};
	});

	result['this'] = {
		template: getTemplate(element.firstElementChild, defData, 'main', 'this'),
	};

	return result;
}

function createPlaceHolder(elm, attr) {
	elm.parentNode.setAttribute('cr-parent-container', attr);
	return elm;
}

function getAttrMap(element, attr, fn) {
	var data = {};
	var elements = [element].concat([].slice.call($$('[' + attr + ']', element)));

	for (var n = elements.length, attribute = '', chunks = []; n--;) {
		attribute = elements[n].getAttribute(attr);
		chunks = attribute ? attribute.split(/\s*;+\s*/) : [];

		for (var m = chunks.length, item = [], type = '', value = ''; m--;) {
			item = chunks[m].split(/\s*:+\s*/);
			type = item[0];
			value = item[1];
			if (!value) {
				data[type] = data[type] || [];
				data[type].push(elements[n]);
			} else {
				data[type] = data[type] || {};
				data[type][value] = data[type][value] || [];
				data[type][value].push(elements[n]);
			}
			fn && fn(type, value, elements[n]);
		}
		// elements[n].removeAttribute(attr);
	}

	return data;
}

function restoreInnerComponents(items, component) {
	for (var n = items.length, cache = []; n--;) { // TODO: maybe $$('')
		var tmpElm = $('[cr-replace="' + items[n].index + '"]', component);

		if (tmpElm) {
			tmpElm.parentNode.replaceChild(items[n].element, tmpElm);
		} else {
			cache.push(items[n]);
		}
	}
	if (cache.length) restoreInnerComponents(cache, component);
}

function removeInnerComponents(elements, component) {
	var items = [].slice.call(elements).map(function (element, idx) {
		var tmpElm = document.createElement(element.tagName);

		element.parentNode.replaceChild(tmpElm, element);
		tmpElm.setAttribute('cr-replace', idx);

		return { index: idx, element: element };
	});

	return function () {
		restoreInnerComponents(items, component);
	}
}

function getViewMap(element, fn) {
	var start = element.hasAttribute('cr-view') ? [element] : [];
	var elements = start.concat([].slice.call($$('[cr-view]', element)));
	var views = {};

	for (var n = elements.length; n--;) {
		views[elements[n].getAttribute('cr-view')] = elements[n];
		// elements[n].removeAttribute('cr-view');
		fn && fn(elements[n]);
	}

	return views;
}

});
