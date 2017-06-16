(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root);
	} else if (typeof define === 'function' && define.amd) {
		define('DOMinator', [], function () {
				return factory(root);
			});
	} else {
		root.DOMinator = factory(root);
	}
}(this, function(window) {
	'use strict';

	var DOMinator = function(options) {
			this.options = {

			};

			initDOMinator(this, options);
		},
		initDOMinator = function(_this, options) {
			for (var option in options) {
				_this.options[option] = options[option];
			}

			_this.version = '0.1.0';
			// DocumentFragment will be implemented again later on
			// _this.fragment = document.createDocumentFragment();
			_this.helper = document.createElement('div');
			// _this.firstLap = false; // TODO: check this
		},
		lazy = function(obj, fn) {
			clearTimeout(obj._timer);
			obj._func = fn;
			obj._timer = setTimeout(fn, 0);
		};


	DOMinator.prototype = {
		render: function(html, operator, parentNode, siblingElement) {
			var isHTML = typeof html === 'string';
			var element = {};

			if (isHTML) {
				this.helper.innerHTML = html;
				element = this.helper.children[0];
			} else {
				element = html;
			}

			if (operator === 'prependChild' || operator === 'insertAfter') {
				siblingElement = siblingElement && siblingElement.nextSibling ||
					operator === 'prependChild' && parentNode.children[0];
				operator = siblingElement ? 'insertBefore' : 'appendChild';
			}

			if (operator === 'replaceChild') {
				parentNode[operator](element, siblingElement);
				return element;
			}

			return parentNode[operator](element, siblingElement);;
		},
		appendImmediately: function(obj) {
			obj = obj || this;
			if (!obj._func) {
				return;
			}
			clearTimeout(obj._timer);
			obj._func();
			delete obj._func;
			delete obj._timer;
		}
	};

	return DOMinator;
}));