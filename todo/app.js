// Full spec-compliant TodoMVC with localStorage persistence + sorting
// and hash-based routing in ~132 effective lines of JavaScript.
require(['circular'], function(Circular) {
	'use strict';

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
	var STORAGE_KEY = 'todos-circularjs-0.1';

	var Toolbox = Circular.Toolbox;
	var circular = new Circular();
	var list = circular.component('list', {
			model: Toolbox.storageHelper.fetch(STORAGE_KEY),
			listeners: ['text', 'done'],
			subscribe: function(property, item, value, oldValue, type) {
				property = listCallbacks[property] ? property : 'nodeChange';
				listCallbacks[property](item, item.views, value);
				Toolbox.storageHelper.saveLazy(this.model, STORAGE_KEY);
			},
			eventListeners: {
				toggle: function (e, element, item) {
					item.done = element.checked;
				},
				delete: function (e, element, item) {
					this.removeChild(item);
				},
				save: function (e, element, item) {
					item.text = element.value;
				},
				edit: function (e, element, item) {
					makeItemEditable(item.views.text, item.text);
				},
				blurItem: function (e, element, item) {
					blurItem(element, item.views.label, item.text);
				},
				escape: function (e, element, item) {
					escapeItem(e, element, item.views.label, item.text);
				}
			}
		});
	var listCallbacks = {
			text: function (item, views, value) {
				blurItem(views.text, views.label, value);
			},
			done: function (item, views, value) {
				markItem(item.elements.element, views.toggle, value);
				listCallbacks.nodeChange();
			},
			nodeChange: function () {
				Toolbox.lazy(function() {
					var getItems = list.getElementsByProperty;
					var all = getItems().length;
					var checked = getItems('done', true).length;
					var uiViews = app_ui.model[0].views;

					renderFooter(uiViews, checked, all);
					renderLeft(app_ui.templates.itemsLeft.partials.self,
						uiViews.counter, all - checked);
					renderMarkAll(uiViews.toggle, all === checked);
				}, list);
			}
		};
	var app_ui = circular.component('app', {
			model: [{ filter: 'all' }],
			eventListeners: {
				addItem: function (e, element, item) {
					var text = element.value.trim();

					if ((e.which || e.keyCode) === ENTER_KEY && text) {
						list.appendChild({
							text: text,
							done: false
						});
						element.value = '';
					}
				},
				deleteDone: function (e, element, item) {
					var items = list.getElementsByProperty('done', true);

					for (var n = items.length; n--; ) {
						list.removeChild(items[n]);
					}
				},
				toggleAll: function (e, element, item) {
					var checked = e.target.checked;
					var items = list.getElementsByProperty('done', !checked);

					for (var n = items.length; n--; ) {
						items[n].done = checked;
					}
				}
			},
			onInit: function(component) {
				circular.addRoute({
					path: '(/)(:filter)',
					callback: function(data) {
						var value = data.parameters.filter || 'all';
						var item = component.model[0];

						renderFilters(item.views, value, item.filter);
						item.filter = value;
					}
				}, true);
				listCallbacks.nodeChange();
			}
		});

	// following functions only use parameters, no other circular stuff
	function markItem(element, input, toggle) {
		element.classList.toggle('completed', toggle);
		input.checked = toggle;
	}

	function makeItemEditable(elm, value) {
		elm.style.display = 'block';
		elm.focus();
		elm.value = value;
	}

	function blurItem(elm, label, value) {
		elm.style.display = '';
		label.textContent = value;
	}

	function escapeItem(e, elm, label, value) {
		if ((e.which || e.keyCode) === ESCAPE_KEY) {
			elm.value = value;
			blurItem(elm, label, value);
		}
	}

	function renderLeft(template, elm, count) {
		elm.innerHTML = template({count: count, plural: count !== 1});
	}

	function renderMarkAll(elm, value) {
		elm.checked = value;
	}

	function renderFilters(views, value, filter) { // TODO
		filter && views[filter].classList.remove('selected');
		views[value].classList.add('selected');

		views.app.classList.remove(filter);
		views.app.classList.add(value);
	}

	function renderFooter(views, toggle, countAll) {
		views.clear.style.display = toggle ? '' : 'none';
		views.footer.style.display = countAll ? '' : 'none';
		views.main.style.display = countAll ? '' : 'none';
	}
});