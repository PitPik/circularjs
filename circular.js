(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root,
			require('toolbox'),
			require('controller'),
			require('schnauzer'),
			require('VOM'));
	} else if (typeof define === 'function' && define.amd) {
		define('circular', ['toolbox', 'controller', 'schnauzer', 'VOM'],
			function (Toolbox, Controller, Schnauzer, VOM) {
				return factory(root, Toolbox, Controller, Schnauzer, VOM);
			});
	} else {
		root.Circular = factory(root, root.Toolbox, root.Controller,
			root.Schnauzer, root.VOM);
	}
}(this, function(window, Toolbox, Controller, Schnauzer, VOM) {
	'use strict';

	var Circular = function(options) {
			this.options = {
				componentAttr: 'cr-component',
				containerAttr: 'cr-container',
				templateAttr: 'cr-template-for',
				templatesAttr: 'cr-template',
				eventAttribute: 'cr-event',
				viewAttr: 'cr-view', // TODO...
				elements: 'elements', // TODO: check usage
				events: 'events',
				views: 'views'
			};

			initCircular(this, options);
		},
		initCircular = function(_this, options) {
			for (var option in options) {
				_this.options[option] = options[option];
			}

			_this.version = '0.1.0';
			_this.components = {};
			_this.id = 'cr_' + id++;
		},
		_animate = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame || function(cb){cb()},
		$ = Toolbox.$,
		$$ = Toolbox.$$,
		id = 0,
		instanceList = {};

	Circular.prototype.component = function(name, parameters) {
		var _inst = {}, // current instance
			proto = {},
			options = this.options,
			elmsTxt = options.elements,
			extraModel = parameters.extraModel || options.extraModel,
			componentAttr = options.componentAttr,
			componentSelector = '[' + componentAttr + '="' + name + '"]',
			componentElement = $(document.body, componentSelector),
			nestingData = checkRestoreNesting(componentElement, componentAttr),
			data = getDomData(options, parameters, componentElement, name),
			component = this.components[name] = {
				name: name,
				model: parameters.model || [],
				element: data.element,
				container: data.container
			};

		instanceList[this.id] = instanceList[this.id] || {};
		_inst = instanceList[this.id][name] = {};

		_inst.helper = document.createElement('div');
		_inst.controller = parameters.eventListeners && new Controller({
			appElement: data.element,
			eventListeners: parameters.eventListeners
		});

		_inst.template = data.template ? new (options.Template || Schnauzer)(
			parameters.template || data.template, {
				doEscape: false,
				helpers: parameters.helpers || options.helpers || {} // TODO
			}) : null;

		component.templates = data.templates;
		_inst.vom = new VOM(component.model, {
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
						$(element, parameters.mountSelector)
				}, true);
				// collect events
				this.reinforceProperty(item, options.events, {}, true);
				_inst.controller && _inst.controller.getEventListeners(this,
					item[elmsTxt].element || component.element,
					item[options.events], component);
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
			enhanceMap: this.options.enhanceMap || parameters.enhanceMap || [],
			setterCallback: function(property, item, value, oldValue, sibling) {
				var element = item[elmsTxt] && item[elmsTxt].element,
					parentElement = item.parentNode && item.parentNode[elmsTxt] ?
						item.parentNode[elmsTxt].element : component.container;

				if (property === 'removeChild') {
					render(_inst.helper, element, property, element.parentElement);
				} else if (property === 'sortChildren') {
					// speed up sorting... TODO: check
					render(_inst.helper, element, 'appendChild', parentElement);
				} else if (this[property]) { // has method
					if (item === sibling) {
						element = render(_inst.helper,
							_inst.template.render(item, extraModel),
							property, parentElement, sibling[elmsTxt].element);
						item[elmsTxt].element = element;
						item[elmsTxt].container = parameters.mountSelector &&
							$(element, parameters.mountSelector);

							item[options.events] = {};
						_inst.controller && _inst.controller.getEventListeners(
							this, item[elmsTxt].element ||
							component.element, item[options.events], component);
						item[options.views] = {};
						getViews(options, item[options.views],
							item[elmsTxt].element || component.element);
					} else if (property !== 'replaceChild') {
						render(_inst.helper, element, property, parentElement,
								sibling[elmsTxt] && sibling[elmsTxt].element);
					}
				}
				parameters.setterCallback && parameters.setterCallback
					.call(this, property, item, value, oldValue);
			},
			// moveCallback: function(item, type, sibling) {
			// 	type !== 'appendChild' && _inst.dominator.appendImmediately();
			// }
		});

		checkRestoreNesting(null, null, nestingData);

		proto = transferMethods(Schnauzer, _inst.template, component, this, proto);
		proto = transferMethods(VOM, _inst.vom, component, this, {
			render: proto.render
		});
		component.__proto__ = proto;

		return component;
	};

	Circular.prototype.destroy = function() {
		var _inst = instanceList[this.id];

		for (var component in _inst) {
			for (var instance in _inst[component]) {
				_inst[component][instance] &&
				_inst[component][instance].destroy &&
				_inst[component][instance].destroy();
			}
		}
	}

	Circular.Toolbox = Toolbox;

	return Circular;

	function render(helper, html, operator, parentNode, sibling) {
		var isHTML = typeof html === 'string',
			isPrepend = operator === 'prependChild',
			element = {};

		if (isHTML) {
			helper.innerHTML = html;
			element = helper.children[0];
		} else {
			element = html;
		}

		_animate(function() {
			if (isPrepend || operator === 'insertAfter') {
				sibling = sibling && sibling.nextSibling ||
					isPrepend && parentNode.children[0];
				operator = sibling ? 'insertBefore' : 'appendChild';
			}

			(parentNode || element.parentElement)[operator](element, sibling);
		});

		return element;
	}

	function getViews(options, views, element) {
		var elements = $$(element, '[' + options.viewAttr + ']'),
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
		var temp = {},
			tempContainer = {};

		if (restore) {
			if (restore[0]) {
				restore[1].insertBefore(restore[2], restore[0]);
			} else {
				restore[1].appendChild(restore[2]);
			}
		} else if (comp && attr) {
			temp = $(comp, '[' + attr + ']');
			if (temp) {
				tempContainer = document.createDocumentFragment();
				restore = [temp.nextSibling, temp.parentNode, tempContainer];
				tempContainer.appendChild(temp);
			}
			return restore;
		}
	}

	// ----- get component data
	function getDomData(options, parameters, component, name) {
		var containerAttr = options.containerAttr,
			container = component.hasAttribute(containerAttr) ? component :
				$(component, '[' + containerAttr + '="' + name + '"]') ||
				$(component, '[' + containerAttr + ']'),
			template = $(document.body,
				'[' + options.templateAttr + '="' + name + '"]'),
			_templates = ($$(document.body, 
				'[' + options.templatesAttr + '="' + name + '"]') || []),
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
}));
