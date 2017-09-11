(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root, require('circular'));
	} else if (typeof define === 'function' && define.amd) {
		define('ui-components', ['circular'], function (Circular) {
			return factory(root, Circular);
		});
	} else {
		root.UIComponents = factory(root, root.Circular);
	}
}(this, function(window, Circular) {
	'use strict';

	var UIComponents = function(options) {
			this.options = {
				attribute: 'cr-ui',
				template: 'ui-components.html',
				classSelected: 'selected', // TODO: use those
				classChecked: 'checked',
				classFocus: 'focus',
				classOver: 'over',
				classShow: 'show',
				classAbsolute: 'absolute',
				classFixed: 'fixed',
				classOpenUp: 'open-up',
				classSmall: 'small',
				classHide: options.classHide || 'hide',
				classActive: options.classActive || 'active'
			};

			return init(this, options || {});
		},
		init = function(_this, options) {
			// TODO: toggle disabled
			for (var option in options) { // extend options
				_this.options[option] = options[option];
			}
			_this.components = new Circular(_this.options);
			_this.templates = document.querySelector(options.templateSelector);

			return _this.templates && new Circular.Toolbox.Promise(function(resolve) {
				_this.templates = processTemplate(_this.templates.innerHTML);
				resolve(_this);
			}) || Circular.Toolbox.ajax(_this.options.template, {
				cache: true
			}).then(function(data) {
				_this.templates = processTemplate(data);
				return _this;
			});
		},
		_templates = {},
		_counter = 0,
		toggleClass = Circular.Toolbox.toggleClass,
		addClass = Circular.Toolbox.addClass,
		removeClass = Circular.Toolbox.removeClass,
		hasClass = Circular.Toolbox.hasClass,
		toggleElements = function(elements, className, value, oldValue) {
			toggleClass(elements[oldValue], className, false);
			toggleClass(elements[value], className, true);
		},
		KEY_arrowDown = 40,
		KEY_arrowUp = 38,
		KEY_ENTER = 13,
		KEY_SPACE = 32,
		KEY_ESC = 27,
		KEY_TAB = 9;

	UIComponents.prototype = {
		addComponent: function(element) {
			var type = element.getAttribute(this.options.attribute);
			var template = this.templates.querySelector('[name=' + type + ']');

			template = template && (_templates[type] ||
				this.components.template(template.outerHTML));
			_templates[type] = template;

			return components[type](this ,template, element);
		},
		removeComponents: function(component) {
			this.components.destroy(component); // TODO: check
		},
		addAllComponents: function(element) {
			var all = (element || document).querySelectorAll(
					'[' + this.options.attribute + ']');
			var components = [];

			for (var n = 0, m = all.length; n < m; n++) {
				components.push(this.addComponent(all[n]));
			}
			return components;
		}
	};

	var components = {
		'simple-select': function(_this, template, label) {
			var options = _this.options;
			var select = label.querySelector('select'); // .children[0];
			var selectedIndex = select.options.selectedIndex;
			var name = 'simple-select-' + _counter++;
			var isInitialized = false;
			var model = {
					options: [].slice.call(select.options, 0),
					text: select.options[selectedIndex].textContent,
					selectedIndex: selectedIndex,
					active: false,
					over: null,
					current: selectedIndex,
					focused: false,
					disabled: select.disabled,
					class: select.className
				};

			select.setAttribute('cr-event', 'change: change; keydown: keydown;' +
				'focus: focus; blur: focus');
			select.insertAdjacentHTML('beforebegin', template.render(model));
			toggleClass(label, 'initialized', true);

			return _this.components.component(name, {
				componentElement: label,
				model: [model],
				listeners: ['*'],
				subscribe: function(property, item, value, oldValue) {
					var optionsViews = item.views.options.children;
					var container = item.views.container;
					var index = item.selectedIndex;

					if (item.disabled) {
						return false;
					}

					if (!isInitialized) {
						container.style.width = container.offsetWidth + 'px';
						toggleClass(container, options.classAbsolute, true);
						isInitialized = true;
						if (hasClass(container, options.classFixed)) {
							Toolbox.addEvent(window, 'resize', function() {
								posititonOptions(container, item.views.options, options);
							}, this);
						}
					}

					if (property === 'selectedIndex' && value >= 0) {
						if (value !== oldValue) {
							toggleElements(optionsViews, options.classOver,
								value, oldValue);
						}
					} else if (property === 'active') {
						if (value !== true && item.current !== index) {
							select.value = select.options[index].value;
							item.text = select.options[index].textContent;
							toggleElements(optionsViews, options.classSelected,
								index, item.current);
						}
						if (oldValue === true && item.current !== index) {
							select.dispatchEvent(new Event(
								'change', {'bubbles': true}));
						}
						item.current = index;
						if (value === true) { // TODO
							select.focus();
							if (hasClass(container, options.classSmall)) {
								item.current = -1;
							}
						}
						toggleClass(container, options.classShow, value);
						if (hasClass(container, options.classFixed) && value === true) {
							posititonOptions(container, item.views.options, options);
						}
					} else if (property === 'text') {
						item.views.select.innerHTML = value;
					} else if (property === 'over') {
						toggleElements(optionsViews, options.classOver, value, oldValue);
					} else if (property === 'focused') {
						if (value === false) {
							index = item.current;
							item.active = false;
						}
						toggleClass(item.views.select, options.classFocus, value);
					}
				},
				eventListeners: {
					change: function(e, element, item) {
						item.selectedIndex = element.options.selectedIndex;
						item.active = false;
					},
					pointerdown: function(e, element, item) {
						if ((e.button || e.which) > 1) return;
						e.preventDefault();
						if (item.views.select === e.target) {
							item.selectedIndex = item.current;
							item.active = !item.active;
						}
					},
					pointerup: function(e, element, item) {
						var index = e.target.getAttribute('data-index');

						if (index !== null) {
							item.selectedIndex = +index;
							item.active = false;
						}
					},
					pointerover: function(e, element, item) {
						var index = e.target.getAttribute('data-index');

						index = index !== null ? +index : null;
						item.over = e.type === 'mouseover' ? index : null;
						// if (index !== null && e.type === 'mouseover') {
						// 	item.selectedIndex = index;
						// }
					},
					keydown: function(e, element, item) {
						var value = null;

						if (e.keyCode == KEY_TAB || e.keyCode === KEY_ESC) {
							if (item.active) {
								item.selectedIndex = item.current;
								item.active = false;
							}
							return;
						}
						e.preventDefault();

						if (e.keyCode === KEY_ENTER || e.keyCode === KEY_SPACE) {
							item.selectedIndex = item.selectedIndex;
							item.active = false;
						} else if (e.keyCode === KEY_arrowDown) {
							value = item.selectedIndex <
								select.options.length - 1 ? 1 : 0;
						} else if (e.keyCode === KEY_arrowUp) {
							value = item.selectedIndex > 0 ? -1 : 0 ;
						}
						if (value !== null) { // keyUp || keyDown
							if (item.active) {
								item.selectedIndex += value;
							} else {
								item.active = true;
							}
						}
					},
					focus: function(e, element, item) {
						item.focused = e.type === 'focus';
					}
				}
			});
		},
		'checkbox': function(_this, template, label) {
			var options = _this.options;
			var checkbox = label.querySelector('input'); // .children[0];
			var name = 'checkbox-' + _counter++;
			var classNames = checkbox.className && checkbox.className
					.split(/[-]{2,}/) || [];
			var model = {
					checked: checkbox.checked,
					focused: false,
					disabled: checkbox.disabled,
					classNames: classNames
				};

			checkbox.setAttribute('cr-event', 'change: change;' +
				'focus: focus; blur: focus');
			checkbox.insertAdjacentHTML('beforebegin', template.render(model));
			toggleClass(label, 'initialized', true);

			return _this.components.component(name, {
				componentElement: label,
				model: [model],
				listeners: ['*'],
				subscribe: function(property, item, value, oldValue) {
					if (property === 'checked') {
						var container = item.views.container;

						if (classNames[0] !== classNames[1]) {
							toggleClass(container, classNames[0], value);
							toggleClass(container, classNames[1], !value);
						}
						toggleClass(container, options.classChecked, value);
					} else if (property === 'focused') {
						toggleClass(item.views.container, options.classFocus, value);
					}
				},
				eventListeners: {
					change: function(e, element, item) {
						item.checked = element.checked;
					},
					focus: function(e, element, item) {
						item.focused = e.type === 'focus';
					}
				}
			});
		},
		'radio': function(_this, template, element) {
			var options = _this.options;
			var radios = element.children;
			var name = 'radio-' + _counter++;
			var lastSelected = 0;
			var model = [].slice.call(radios, 0).map(function(elm, idx) {
					var input = elm.querySelector('input'); // TODO: cr-view

					if (input.checked) {
						lastSelected = idx;
					}
					return {
						checked: input.checked,
						disabled: input.disabled,
						className: input.className
					}
				});

			element.setAttribute('cr-event', 'change: change;' +
				'focus: focus; blur: blur');
			toggleClass(element, 'initialized', true);

			return _this.components.component(name, {
				componentElement: element,
				model: model,
				template: template, /// TODO: no caching
				enrichModelCallback: function(item) {
					var element = item.elements.element;

					window.requestAnimationFrame(function(){
						radios[item.index].insertBefore(element,
							radios[item.index].children[0]);
						// put input inside so the item gets found
						// when event is triggered...
						element.appendChild(element.nextSibling);
					});
				},
				eventListeners: {
					change: function(e, element, item) {
						toggleClass(model[lastSelected].elements.element,
							options.classSelected, false);
						toggleClass(item.elements.element, options.classSelected, true);
						lastSelected = item.index;
					},
					blur: function(e, element, item) {
						toggleClass(item.elements.element, options.classFocus, false);
					},
					focus: function(e, element, item) {
						toggleClass(item.elements.element, options.classFocus, true);
					}
				}
			});
		},
		'modal-tab-form': function(_this, template, element) {
			var options = _this.options;
			var name = 'modal-tab-form-' + _counter++;
			var component = _this.components.component(name, {
					componentElement: element,
					model: [{}],
					listeners: ['_isDirty'],
					subscribe: function(property, item, value, oldValue) {
						if (property === 'replaceChild') {
							removeClass(component.element, options.classHide);
						}
					},
					eventListeners: {
						saveData: function(e, element, item) {
							e.preventDefault();
							if (this.model[0]._isDirty) {
								component.okCallback && component.okCallback(item.item);
								addClass(component.element, options.classHide);
							} else {
								addClass(component.element, options.classHide);
							}
						},
						closePrefs: function(e, element, item) {
							addClass(component.element, options.classHide);
						},
						setDirty: function(e, element, item) {
							item._isDirty = true;
						},
						switchTabs: function(e, element, item) { // TODO: more general approach
							var isButton0 = item.views.tabButton0 === e.target;

							toggleClass(item.views.tabButton0, options.classActive, isButton0);
							toggleClass(item.views.tabButton1, options.classActive, !isButton0);
							toggleClass(item.views.tab0, options.classHide, !isButton0);
							toggleClass(item.views.tab1, options.classHide, isButton0);
						},
						close: function(e, element, item) {
							if (e.target === element) {
								addClass(component.element, options.classHide);
							}
						}
					},
					helpers: {
						renderProperties: renderPropertiesHelper,
						rights: function(html, $1) {
							// TODO: make this happen... if needed
							return;
							//
							if (options.userRole === 'admin') {
								return;
							}
							if (!/(manager|admin)/.test(this.getData('propViewHint'))) {
								return $1 + ' tabindex="-1"' // TODO.... get right rights
							}
						}
					}
				});

			function renderPropertiesHelper(html, $label, $name, $value, $readonly) {
				var HTMLOut = '';
				var getTags = function(tags, type) {
					for (var out = [], n = 0, m = tags.length; n < m; n++) {
						if (tags[n].type === type) {
							out.push(tags[n].value);
						}
					}
					return out.join(', ');
				};
				var propertiesList = []; // extract propertiesList from template
				var html = html.replace(/propertiesList: \[([\S\s]*)\];*\s*/, function(all, $1) {
						propertiesList = JSON.parse('[' + $1 + ']');
						return ''; // replaces it by empty string
					});
				for (var item = {}, n = 0, m = propertiesList.length; n < m; n++) {
					item = propertiesList[n];
					HTMLOut += html
						.replace('{{~~' + $label + '~~}}', item[$label])
						.replace('{{~~' + $readonly + '~~}}', item[$readonly] ?
							'readonly tabindex="-1"' : '')
						.replace(RegExp('{{~~' + $name + '~~}}', 'g'), item[$value])
						.replace('{{~~' + $value + '~~}}', item[$value].indexOf('tags') === 0 ?
							getTags(this.getData('item.tags') || [], item[$value].split(':')[1]) :
							this.getData('item.' + item[$value]));
				}

				return HTMLOut;
			}

			return component;
		},
		'modal-report': function(_this, template, element) {
			var options = _this.options;
			var name = 'modal-report-' + _counter++;
			var closeExportModal = function (e, element, item) {
				addClass(component.element, options.classHide);
			}
			var component = _this.components.component(name, {
					componentElement: element,
					model: [{}],
					subscribe: function(property, item, value, oldValue) {
						if (property === 'replaceChild') {
							removeClass(component.element, options.classHide);
						}
					},
					eventListeners: {
						closePanes: closeExportModal,
						exportItem: closeExportModal,
						close: function(e, element, item) {
							if (element === e.target) {
								addClass(component.element, options.classHide);
							}
						}
					}
				});

			return component;
		},
		'inline-report': function(_this, template, element) {
			var options = _this.options;
			var name = 'inline-report-' + _counter++;
			var component = _this.components.component(name, {
					componentElement: element,
					model: [{
						visible: false,
						item: undefined // TODO change logic... more generic
					}],
					listeners: ['*'],
					subscribe: function(property, item, value, oldValue) {
						if (property === 'visible') {
							if (value === true && item.item) {
								item.item.elements.element
									.appendChild(item.elements.element);
								item.views.title.innerHTML = component.templates
									.removeTitle.partials.self(item.item);
							}
							toggleClass(item.elements.element, options.classHide, !value);
						} else if (property === 'item') {
							item.visible = !!value;
						}
					},
					eventListeners: {
						removeConfirmation: function(e, element, item) {
							if (e.target === item.views.remove) {
								component.okCallback(item.item);
							} else if (e.target === item.views.cancle) {
								component.cancleCallback &&
									component.cancleCallback(item.item);
								item.visible = false;
							}
							return false;
						}
					}
				});

			return component;
		},
		'drop-zone': function(_this, template, element) {
			var options = _this.options;
			var name = 'drop-zone-' + _counter++;
			var component = _this.components.component(name, {
					componentElement: element,
					model: [{
						isFile: false
					}],
					listeners: ['*'],
					subscribe: function(property, item, value, oldValue) {
						toggleClass(item.views.file, options.classHide, !value);
						toggleClass(item.views.text, options.classHide, value);
					},
					eventListeners: {
						dragleave: function(e, element, item) {
							addClass(element, options.classHide);
						},
						dragover: function(e, element, item) {
							var isCatalogItem = e.dataTransfer.types
									.indexOf('item') !== -1;
							var isFile = e.dataTransfer.types.indexOf('Files') !== -1;

							if (item.isFile !== isFile) { // debounce
								item.isFile = isFile;
							}
							e.preventDefault();
							e.dataTransfer.dropEffect = 'move';
						},
						drop: function(e, element, item) {
							var data = e.dataTransfer.getData('text') ||
									e.dataTransfer.types;
							var model = e.dataTransfer.getData('json/text');

							addClass(element, options.classHide);
							_this.components.publish('aaa', 'catalog', 'add-item', {
								uuid: data,
								item: JSON.parse(model)
							});
							e.preventDefault();
						}
					}
				});

			return component;

		}
	};

	function posititonOptions(container, optionContainer, options) {
		var coords = container.getBoundingClientRect();

		optionContainer.style.cssText =
			'left: ' + coords.left + 'px;' +
			(hasClass(container, options.classOpenUp) ?
				'bottom: calc(100% - ' + coords.top + 'px); top: auto;' :
				'top: ' + coords.bottom + 'px;');
	}


	function processTemplate(template) {
		var helper = document.createElement('helper');

		helper.innerHTML = template
			.replace(/^[\S\s]*<body.*?>/, '')
			.replace(/<\/body>[\S\s]*$/, '');
		return helper;
	}

	return UIComponents;
}));