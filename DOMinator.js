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
			_this.fragment = document.createDocumentFragment();
			_this.helper = document.createElement('div');
		},
		lazy = function(obj, fn) {
			clearTimeout(obj.timer);
			obj.func = fn;
			obj.timer = setTimeout(fn, 0);
		},
		firstLap = false; // TODO: check this
		
	DOMinator.prototype = {
		render: function(html, parentContainer, type, container, sibling) {
			var self = this,
				element = {},
				elm = {},
				isHTML = typeof html === 'string';

			if (isHTML) {
				this.helper.innerHTML = html; // removeChild: replaceChild ??
				elm = this.helper.children[0];
			} else {
				elm = html;
			}

			if (container && firstLap) { // direct
				element = container.appendChild(elm);
			} else { // fragment
				element = isHTML ? this.fragment.appendChild(elm) : elm;

				!firstLap && lazy(this, function() {
					firstLap = false;
					if (type === 'prependChild' && parentContainer.children.length) {
						parentContainer.insertBefore(self.fragment,
							parentContainer.children[0]);
					} else if (type === 'insertBefore') {
						sibling.parentNode.insertBefore(self.fragment, sibling);
					} else if (type === 'insertAfter' && sibling.nextSibling) {
						sibling.parentNode.insertBefore(self.fragment,
							sibling.nextSibling);
					} else if (type === 'replaceChild') {
						sibling.parentNode.replaceChild(self.fragment, sibling);
					} else { // regular append
						parentContainer.appendChild(self.fragment);
					}
				});
			};
			firstLap = true;
			return element;
		},
		appendImmediately: function() {
			if (!this.func) {
				return;
			}
			clearTimeout(this.timer);
			this.func();
			delete this.func;
		}
	}

	return DOMinator;
}));