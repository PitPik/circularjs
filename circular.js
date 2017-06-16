(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root,
			require('toolbox'),
			require('controller'),
			require('schnauzer'), // TODO: !!!!!!!!
			require('VOM'),
			require('DOMinator'));
	} else if (typeof define === 'function' && define.amd) {
		define('circular', ['toolbox', 'controller', 'schnauzer', 'VOM', 'DOMinator'],
			function (Toolbox, Controller, Schnauzer, VOM, DOMinator) {
				return factory(root, Toolbox, Controller, Schnauzer, VOM, DOMinator);
			});
	} else {
		root.Circular = factory(root, root.Toolbox, root.Controller, root.Schnauzer,
			root.VOM, root.DOMinator);
	}
}(this, function(window, Toolbox, Controller, Schnauzer, VOM, DOMinator) {
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
		$ = Toolbox.$,
		$$ = Toolbox.$$,
		id = 0,
		instanceList = {};


	Circular.prototype.component = function(name, parameters) {
		var // self = this,
			_inst = {}, // current instance
			proto = {},
			options = this.options,
			elements = options.elements,
			componentAttr = options.componentAttr,
			componentElement = $(document, '[' + componentAttr + '="' + name + '"]'),
			nestingData = checkRestoreNesting(componentElement, componentAttr),
			data = getDomData(options, componentElement, name),
			component = this.components[name] = {
				name: name,
				model: parameters.model || [{__init: true}],
				element: data.element,
				container: data.container
			};

		instanceList[this.id] = instanceList[this.id] || {};
		_inst = instanceList[this.id][name] = {};

		_inst.dominator = new DOMinator({});
		_inst.controller = parameters.eventListeners && new Controller({
			appElement: data.element,
			eventListeners: parameters.eventListeners
		});
		_inst.template = data.template ? new (options.Template || Schnauzer)(
			parameters.template || data.template, {
				doEscape: false,
				helpers: this.options.helpers || {} // TODO
			}) : null;
		component.templates = data.templates;
		_inst.vom = new VOM(component.model, {
			preRecursionCallback: function(item, type, siblingOrParent) {
				var html = _inst.template &&_inst.template.partials.self &&
						_inst.template.render(item),
					operator = type || 'appendChild',
					replaceElement = type === 'replaceChild' && siblingOrParent[elements].element,
					container = item.parentNode[elements] &&
						item.parentNode[elements].container,
					parentNode = html && siblingElement || container || component.container,
					siblingElement = parentNode ? replaceElement || undefined : siblingOrParent &&
						siblingOrParent[elements].element,
					element = html && _inst.dominator
						.render(html, operator, parentNode, siblingElement) ||
							component.element;

				this.isNew = true; // ???????
				// collect elements
				this.reinforceProperty(item, elements, {
					element: element,
					container: parameters.mountSelector &&
						$(element, parameters.mountSelector)
				});
				// collect events
				this.reinforceProperty(item, options.events, {});
				_inst.controller && _inst.controller.getEventListeners( // TODO
					this, item[elements].element ||
					component.element, item[options.events], component);
				// collect view elements
				this.reinforceProperty(item, options.views, {});
				getViews(options, item[options.views],
					item[elements].element || component.element);

				this.options.vom && this.options.vom.preRecursionCallback &&
					this.options.vom.preRecursionCallback(item);
			},
			enrichModelCallback: this.options.enrichModelCallback || function() {},
			 // TODO: get options via...
			enhanceMap: this.options.enhanceMap || parameters.enhanceMap || [],
			setterCallback: function(property, item, value, oldValue, sibling) {
				var element = item[elements].element,
					parentElement = item.parentNode[elements] ?
						item.parentNode[elements].element : component.container;

				if (property === 'removeChild') {
					_inst.dominator.render(element, property, element.parentElement);
				} else if (property === 'sort') {
					_inst.dominator.render(element, 'appendChild', parentElement);
				} else if (!this.isNew && _inst.vom[property]) { // has method
					_inst.dominator.render(element, property, parentElement);
				}
				parameters.setterCallback && parameters.setterCallback
					.call(this, property, item, value, oldValue);
				delete this.isNew; // ???????
			},
			moveCallback: function(item, type, sibling) {
				type !== 'appendChild' && _inst.dominator.appendImmediately();
			}
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
				_inst[component][instance].destroy &&
				_inst[component][instance].destroy();
			}
		}
	}

	return Circular;

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
	function getDomData(options, component, name) {
		var containerAttr = options.containerAttr,
			container = component.hasAttribute(containerAttr) ? component :
				$(component, '[' + containerAttr + '="' + name + '"]') ||
				$(component, '[' + containerAttr + ']'),
			template = $(document, '[' + options.templateAttr + '="' + name + '"]'),
			_templates = ($$(document, '[' + options.templatesAttr + '="' + name + '"]') || []),
			templates = {};

		for (var n = _templates.length; n--; ) { // TODO
			templates[_templates[n].id] =
				new (options.Template || Schnauzer)(_templates[n].innerHTML);
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
