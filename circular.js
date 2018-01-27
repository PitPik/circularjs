(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root,
			require('toolbox'),
			require('schnauzer'),
			require('VOM'));
	} else if (typeof define === 'function' && define.amd) {
		define('circular', ['toolbox', 'schnauzer', 'VOM'],
			function (Toolbox, Schnauzer, VOM) {
				return factory(root, Toolbox, Schnauzer, VOM);
			});
	} else {
		root.Circular = factory(root, root.Toolbox, root.Schnauzer, root.VOM);
	}
}(this, function(window, Toolbox, Schnauzer, VOM) {
	'use strict'; // all: 55.35 KB, 24.90 KB, 8.96 KB

	var Circular = function(name, options) {
			this.options = {
				componentAttr: 'cr-component',
				containerAttr: 'cr-container',
				templateAttr: 'cr-template-for',
				templatesAttr: 'cr-template',
				eventAttribute: 'cr-event',
				viewAttr: 'cr-view', // TODO...
				devAttribute: 'cr-dev',
				elements: 'elements', // TODO: check usage
				events: 'events',
				views: 'views',
				hash: '#'
			};

			initCircular(this, name, options);
		},
		initCircular = function(_this, name, options) {
			var hasName = typeof name === 'string';

			if (!hasName) {
				options = name;
			}
			for (var option in options) {
				_this.options[option] = options[option];
			}

			_this.version = '0.1.0';
			_this.components = {};
			_this.id = 'cr_' + id++;
			_this.Toolbox = Toolbox;
			_this.name = hasName ? name : _this.id;
			pubsub[_this.name] = {}; // prepare
		},
		Controller = function(options) {
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
		},
		_animate = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame || function(cb){cb()},
		$ = Toolbox.$,
		$$ = Toolbox.$$,
		id = 0,
		instanceList = {},
		templateCache = {},
		resourceCache = null,
		DOC = null, // createHTMLDocument
		pubsub = {},
		routes = [], // TODO...
		appComponents = {};

	Circular.prototype.component = function(name, parameters) {
		if (this.components[name]) { // TODO: make this possible: name???
			return this.components[name].reset(parameters.model, parameters.extraModel);
		}

		var _this = this,
			_inst = {}, // current instance
			proto = {},
			options = this.options,
			elmsTxt = options.elements,
			extraModel = parameters.extraModel || options.extraModel,
			componentAttr = options.componentAttr,
			componentSelector = '[' + componentAttr + '="' + name + '"]',
			componentElement = parameters.componentElement || // TODO: ... no wrapper
				$(componentSelector, parameters.componentWrapper || document);

		if (!componentElement) return;

		var nestingData = checkRestoreNesting(componentElement, componentAttr),
			altName = componentElement && componentElement.getAttribute('name'),
			data = getDomData(options, parameters, componentElement, altName || name),
			component = this.components[name] = {
				name: name,
				model: parameters.model || [],
				element: data.element,
				container: data.container
			};
		pubsub[this.name][name] = {}; // prepare
		component.templates = data.templates;
		instanceList[this.id] = instanceList[this.id] || {};
		_inst = instanceList[this.id][name] = {};
		_inst.helper = document.createElement('div');

		parameters.onBeforeInit && parameters.onBeforeInit(component);

		_inst.controller = parameters.eventListeners && new Controller({
			appElement: data.element,
			eventAttribute: options.eventAttribute,
			eventListeners: parameters.eventListeners,
			instanceID: _this.id
		});
		_inst.template = parameters.template && parameters.template.version ?
			parameters.template : templateCache[name] ? templateCache[name] :
			data.template ? new (options.Template || Schnauzer)(
			parameters.template || data.template, {
				doEscape: false,
				helpers: parameters.helpers || options.helpers || {} // TODO
			}) : null;
		_inst.template && (templateCache[name] = _inst.template);
		_inst.vom = new VOM(component.model, {
			idProperty: _this.options.idProperty || 'cr-id',
			preRecursionCallback: function(item, type, siblingOrParent) {
				var html = _inst.template && _inst.template.partials.self &&
						_inst.template.render(item, extraModel),
					operator = type || 'appendChild',
					replaceElement = type === 'replaceChild' &&
						siblingOrParent[elmsTxt].element,
					container = item.parentNode[elmsTxt] &&
						item.parentNode[elmsTxt].container,
					parentNode = html && siblingElement ||
						container || component.container,
					siblingElement = parentNode ? replaceElement || undefined :
						siblingOrParent && siblingOrParent[elmsTxt].element,
					element = html && render(_inst.helper, html, operator,
						parentNode, siblingElement) || component.element;

				// collect elements
				this.reinforceProperty(item, elmsTxt, {
					element: element,
					container: parameters.mountSelector &&
						$(parameters.mountSelector, element)
				}, true);
				// collect events
				this.reinforceProperty(item, options.events, {}, true);
				_inst.controller && _inst.controller.getEventListeners(
					item[elmsTxt].element || component.element,
					item[options.events], component, this.options.idProperty);
				// collect view elements
				this.reinforceProperty(item, options.views, {}, true);
				getViews(options, item[options.views],
					item[elmsTxt].element || component.element);

				parameters.preRecursionCallback &&
					parameters.preRecursionCallback.call(this, item);
			},
			enrichModelCallback: this.options.enrichModelCallback ||
				parameters.enrichModelCallback || function() {},
			 // TODO: get options via...
			listeners: this.options.listeners || parameters.listeners || [],
			subscribe: function(property, item, value, oldValue, sibling) {
				var element = item[elmsTxt] && item[elmsTxt].element,
					parentElement = item.parentNode && item.parentNode[elmsTxt] ?
						item.parentNode[elmsTxt].element : component.container;

				if (property === 'removeChild') {
					render(_inst.helper, element, property, element.parentElement);
				} else if (property === 'sortChildren') {
					// speed up sorting... TODO: check
					render(_inst.helper, element, 'appendChild', parentElement);
				} else if (this[property]) { // has method
					if (item === sibling) { // replaceChild by itself
						element = render(_inst.helper,
							_inst.template.render(item, extraModel),
							property, parentElement, sibling[elmsTxt].element);
						item[elmsTxt].element = element;
						item[elmsTxt].container = parameters.mountSelector &&
							$(parameters.mountSelector, element);

						item[options.events] = {};
						_inst.controller && _inst.controller.getEventListeners(
							item[elmsTxt].element || component.element,
							item[options.events], component, this.options.idProperty);
						item[options.views] = {};
						getViews(options, item[options.views],
							item[elmsTxt].element || component.element);
					} else if (property !== 'replaceChild') {
						render(_inst.helper, element, property, parentElement,
								sibling[elmsTxt] && sibling[elmsTxt].element);
					}
				}
				parameters.subscribe && parameters.subscribe
					.call(this, property, item, value, oldValue);

				_this.publish(_this.name, name, property, {
					property: property,
					item: item,
					value: value,
					oldValue: oldValue
				});
			}
		});

		checkRestoreNesting(null, null, nestingData);

		// proto = transferMethods(Schnauzer, _inst.template, component, this, proto);
		proto = transferMethods(VOM, _inst.vom, component, this, proto);
		proto.uncloak = function(item) {
			var item = item && item.element || component.element;

			Toolbox.removeClass(item, 'cr-cloak');
			item.removeAttribute('cr-cloak');
		}
		proto.reset = function(data, extra) { // TODO: extramodel
			_inst.vom.destroy();
			this.container && (this.container.innerHTML = '');
			for (var n = 0, m = data.length; n < m; n++) {
				this.appendChild(data[n]);
			}
			return component;
		}
		component.__proto__ = proto;

		parameters.onInit && parameters.onInit(component);

		return component;
	};

	// Circular.prototype.destroyComponent = function(name) {
	// 	var component = typeof name === 'string' ? this.components[name] : name;
	// 	var _inst = instanceList[this.id][component.name];

	// 	if (component && _inst) {
	// 		_inst.controller && _inst.controller.destroy(component);
	// 		_inst.vom.destroy();
	// 		_inst.template = null;
	// 		component.container && (component.container.innerHTML = '');
	// 	}
	// }

	Circular.prototype.destroy = function(name) { // TODO: review -> use reset
		var _instList = instanceList[this.id];
		var _instance = {};

		for (var component in _instList) {
			if (name && name !== component) continue;
			for (var instance in _instList[component]) {
				_instance = _instList[component][instance];
				_instance && _instance.destroy && _instance.destroy(component);
			}
		}
	};

	Circular.prototype.model = function(model, options) {
		return new VOM(model, options);
	};

	Circular.prototype.template = function(template, options) {
		return new Schnauzer(template, options);
	};

	Circular.Toolbox = Toolbox;

	/* --------------------  pubsub  ----------------------- */

	Circular.prototype.subscribe = function(inst, comp, attr, callback, trigger) {
		inst = inst || this.name;
		pubsub[inst] = pubsub[inst] || {};
		comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
		comp[attr] = comp[attr] || [];
		if (callback) {
			// check also for routers
			comp[attr].push(callback.callback || callback);
			if (callback.regexp && !comp[attr].regexp) {
				comp[attr].regexp = callback.regexp;
				comp[attr].names = callback.names;
			}
		}
		if (trigger && comp[attr].value !== undefined) {
			(callback.callback || callback).call(this, comp[attr].value);
		}
		return (callback.callback || callback);
	};

	Circular.prototype.publish = function(inst, comp, attr, data) {
		inst = inst || this.name;
		pubsub[inst] = pubsub[inst] || {};
		if (pubsub[inst]) {
			comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
			comp[attr] = comp[attr] || [];
			comp[attr].value = data;
			publish(this, comp[attr], data);
		}
	};

	Circular.prototype.unsubscribe = function(inst, comp, attr, callback) {
		var funcNo = -1,
			funcs = {};

		inst = inst || this.name;
		if (pubsub[inst] && pubsub[inst][comp] && pubsub[inst][comp][attr]) {
			funcs = pubsub[inst][comp][attr];
			funcNo = funcs.indexOf(callback.callback || callback);
			if (funcNo !== -1) {
				funcs.splice(funcNo, 1);
			}
		}
		return (callback.callback || callback);
	};

	function publish(_this, pubsubs, data) {
		for (var n = 0, m = pubsubs.length; n < m; n++) {
			pubsubs[n].call(_this, data);
		}
	}

	/* ----------------------- routing -------------------------- */

	Circular.prototype.addRoute = function(data, trigger) {
		var path = typeof data.path === 'object' ?
				{regexp: data.path} : routeToRegExp(data.path),
			parts = extractRouteParameters(path, getPath(this.options.hash)),
			routers = pubsub[this.name].__router;

		this.subscribe(null, '__router', data.path, {
			callback: data.callback,
			names: path.names,
			regexp: path.regexp || path
		}, trigger);

		if (trigger && parts) {
			data.callback.call(this, parts);
		}
		!routers && installRouter(pubsub[this.name].__router, this);
		return data;
	};

	Circular.prototype.removedRoute = function(data) {
		return this.unsubscribe(null, '__router', data.path, data.callback);
	};

	Circular.prototype.toggleRoute = function(data, isOn) { // TODO
		var router = pubsub[this.name].__router,
			callbacks = router[data.path].paused || router[data.path];

		router[data.path] = isOn ? callbacks : [];
		router[data.path].paused = !isOn ? callbacks : null;
	};

	function installRouter(routes, _this) {
		var event = window.onpopstate !== undefined ? 'popstate' : 'hashchange',
			hash = _this.options.hash;

		Toolbox.addEvent(window, event, function(e) {
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
			.replace(/(\(\?)?:\w+/g, function(match, optional) { // named
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

	/* ----------------- resource loader ------------------ */

	Circular.prototype.loadResource = function(fileName, cache) {
		var _this = this,
			devFilter = function(elm) {
				return !elm.hasAttribute(_this.options.devAttribute);
			};

		return Toolbox.ajax(fileName, {cache: cache}).then(function(data) {
			var scripts = [];
			var path = fileName.split('/').slice(0, -1);

			DOC = DOC || document.implementation.createHTMLDocument('');
			DOC.documentElement.innerHTML = data;
			scripts = [].slice.call($$('script', DOC) || [])
				.filter(function(elm) {
					if (elm.getAttribute('type') === 'text/javascript') {
						elm.parentNode.removeChild(elm);
						return devFilter(elm);
					}
					return false;
				});

			return {
				links: [].slice.call($$('link', DOC) || []).filter(devFilter),
				styles: [].slice.call($$('style', DOC) || []).filter(devFilter),
				scripts: scripts,
				body: $('body', DOC),
				head: $('head', DOC),
				path: path.join('/')
			};
		}).catch();
	};

	Circular.prototype.insertResources = function(container, data) {
		var body = $('[' + this.options.devAttribute +'="container"]',
				data.body) || data.body;

		Toolbox.requireResources(data, 'styles', container);
		while(body.childNodes[0]) {
			container.appendChild(body.childNodes[0]);
		}
		return Toolbox.requireResources(data, 'scripts', container);
	};

	Circular.prototype.insertModule = function(fileName, container) {
		var _this = this;

		return this.loadResource(fileName, true)
			.then(function(data) {
				return _this.insertResources(container, data).
					then(function(){
						return data.path;
					});
			});
	};

	function moveChildrenToCache(data) {
		var children = [].slice.call(data.container.childNodes);

		for (var n = 0, m = children.length; n < m; n++) {
			appComponents[data.previousName].cache.appendChild(children[n]);
		}
	}

	Circular.prototype.renderModule = function(data) {
		var cache = null,
			temp = null,
			isInsideDoc = data.container,
			components = appComponents, // speeds up
			name = data.name;

		if (components[data.previousName]) { // remove old app
			moveChildrenToCache(data);
		}
		if (name && components[name]) { // append current app and initialize
			data.container.appendChild(components[name].cache);
			components[name].init && data.init !== false &&
				components[name].init(data.data, components[name].path);
			return new Toolbox.Promise(function(resolve) {
				resolve(components[name].init);
			});
		}
		// create new app and initialize
		cache = document.createDocumentFragment();
		if (!isInsideDoc) { // TODO: find other solution
			temp = document.createElement('div');
			temp.style.display = 'none';
			document.body.appendChild(temp);
		}
		return name ? this.insertModule(data.path, data.container || temp)
			.then(function(path) {
				return new Toolbox.Promise(function(resolve) {
					var moduleName = data.require === true ? name :
							data.require === false ? '' : data.require;

					components[name] = {
						path: path,
						cache: cache
					};
					if (moduleName) {
						require([moduleName], function(init) {
							components[name].init = init;
							data.init !== false && init(data.data, path);
							if (!isInsideDoc) {
								data.container = temp;
								moveChildrenToCache(data);
								temp.parentElement.removeChild(temp);
							}
							resolve(init);
						});
					} else {
						moveChildrenToCache(data);
						temp.parentElement.removeChild(temp);
						resolve();
					}
				})
			}).catch() : new Toolbox.Promise(function(a){a()});
	};

	/* --------------------  UI controller ------------------- */

	Controller.prototype = {
		getEventListeners: function(element, events, component, idProperty) {
			var eventAttribute = this.options.eventAttribute,
				elements = element.querySelectorAll('[' + eventAttribute + ']'),
				attribute = '',
				eventItem = '',
				eventType = '',
				eventFunc = '',
				eventParts = [],
				extraElement = element !== component.element ? component.element : [];

			elements = [element].concat([].slice.call(elements), extraElement);

			for (var n = elements.length; n--; ) { // reverse: stopPropagation
				attribute = elements[n].getAttribute(eventAttribute);
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
			if (!this.installed) { // && this.events !== {}
				this.installEventListeners(component, idProperty);
			}
		},
		installEventListeners: function(component, idProperty) { // $$vom !!!!!
			var that = this;

			for (var key in this.events) {
				Toolbox.addEvent(this.options.appElement, key, function(e) {
					eventDistributor(e, idProperty, component, that);
				}, /(?:focus|blur)/.test(key) ? true : false,
					this.options.instanceID + '_' + component.name);
			}
			this.installed = true;
		},
		destroy: function(component) {
			Toolbox.removeEvent(this.options.instanceID + '_' + component.name);
		}
	};

	return Circular;

	function render(helper, html, operator, parentNode, sibling) {
		var isHTML = typeof html === 'string',
			isPrepend = operator === 'prependChild',
			element = {};

		if (isHTML) {
			// helper.insertAdjacentHTML('beforeend', html);
			helper.innerHTML = html;
			element = helper.children[0];
		} else {
			element = html;
		}

		var renderingFunc = function() {
			if (isPrepend || operator === 'insertAfter') {
				sibling = sibling && sibling.nextSibling ||
					isPrepend && parentNode.children[0];
				operator = sibling ? 'insertBefore' : 'appendChild';
			}

			(parentNode || element.parentElement)[operator](element, sibling);
		};

		// if (true) { // TODO: introduce asyncRendering
			renderingFunc();
		// } else {
		// 	_animate(renderingFunc);
		// }

		return element;
	}

	function getViews(options, views, element) {
		var elements = $$('[' + options.viewAttr + ']', element),
			attribute = '';

		elements = [element].concat([].slice.call(elements));
		for (var n = elements.length; n--; ) { // reverse: stopPropagation
			attribute = elements[n].getAttribute(options.viewAttr);
			if (!attribute) {
				continue;
			}
			views[attribute] = elements[n];
		}
	}

	function transferMethods(fromClass, fromInstance, toInstance, _this, proto) {
		for (var method in fromClass.prototype) {
			if (!_this[method]) {
				proto[method] = (function(method) {
					return function() {
						return fromInstance[method]
							.apply(fromInstance, arguments);
					}
				})(method);
			}
		}
		return proto;
	}

	function checkRestoreNesting(comp, attr, restore) {
		var temp = [],
			tempContainer = checkRestoreNesting.tempContainer =
				checkRestoreNesting.tempContainer || document.createDocumentFragment(),
			restores = [],
			collect = {};

		if (restore) {
			for (var n = restore.length; n--; ) {
				collect = restore[n];
				collect[2][collect[1] ? 'insertBefore' : 'appendChild'](
					collect[0], collect[1]);
				restore[n] = null;
			}
		} else if (comp && attr) {
			temp = $$('[' + attr + ']', comp);
			if (temp.length !== 0) {
				for (var n = 0, m = temp.length; n < m; n++) {
					collect = temp[n];
					restores.push([collect, collect.nextElementSibling, collect.parentNode]);
					tempContainer.appendChild(collect);
				}
			}
			return restores;
		}
	}

	// ----- get component data
	function getDomData(options, parameters, component, name) {
		var searchContainer = component || document.body,
			containerAttr = options.containerAttr,
			container = component.hasAttribute(containerAttr) ? component :
				$('[' + containerAttr + '="' + name + '"]', component) ||
				$('[' + containerAttr + ']', component),
			template = $('[' + options.templateAttr + '="' + name + '"]',
				searchContainer),
			_templates = ($$('[' + options.templatesAttr + '="' + name + '"]',
				searchContainer) || []),
			templates = {};

		for (var n = _templates.length; n--; ) { // TODO
			templates[_templates[n].id || _templates[n].getAttribute('name')] =
				new (options.Template || Schnauzer)(_templates[n].innerHTML, {
					doEscape: false,
					helpers: parameters.helpers || options.helpers || {}
				});
		}

		return {
			element: component,
			template: template ? template.innerHTML : template, // TODO && container??
			templates: templates, // TODO && container??
			container: container,
			// appendMode: container && // ??????????? never used
			// 	container.getAttribute([containerAttr]) || 'append' // replace
		}
	}

	// -------- for Controller --------- //
	// --------------------------------- //
	function eventDistributor(e, idProperty, component, _this) {
		// TODO: cache by e.target for next vars??
		var element = Toolbox.closest(e.target,
				'[' + idProperty + ']') || component.element,
			id = element.getAttribute(idProperty),
			item = component.getElementById(id) || component
				.getElementsByProperty('elements.element', component.element)[0]; // TODO

		if (!item) { // TODO
			item = component.getElementsByProperty('elements.element', e.target)[0]
			|| component.model[0]; // TODO!!!!!!!
		}

		var eventElements = item && item.events[e.type],
			stopPropagation = false,
			eventElement = {};

		for (var key in eventElements) { // TODO: check for optimisation
			for (var n = eventElements[key].length; n--; ) {
				eventElement = eventElements[key][n];
				if (!stopPropagation && (eventElement === e.target ||
							eventElement.contains(e.target)) &&
						_this.options.eventListeners[key]) {
					stopPropagation = _this.options.eventListeners[key]
						.call(component, e, eventElement, item) === false;
					if (stopPropagation) {
						e.stopPropagation();
					}
				}
			}
		}
	}
}));
