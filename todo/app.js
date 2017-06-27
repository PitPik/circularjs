// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~145 effective lines of JavaScript.
window.onload = function() {
	'use strict';

	var STORAGE_KEY = 'todos-circularjs-0.1',
		sortAsc = function(a, b, desc) {
			return Toolbox.itemsSorter(a, b, 'text', desc);
		},
		sortDesc = function(a, b) {
			return sortAsc(a, b, 'text', true);
		},
		todo = window.todo = new Circular(),

		list = todo.component('list', {
			model: Toolbox.storageHelper.fetch(STORAGE_KEY),
			enhanceMap: ['text', 'done'],
			setterCallback: function(property, item, value, oldValue, type) {
				listCallbacks[property] ?
					listCallbacks[property](item, item.views, value) :
					listCallbacks.nodeChange(item, item.views, value);
				Toolbox.storageHelper.save(this.model, STORAGE_KEY); // persist
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
		}),
		listCallbacks = {
			text: function (item, views, value) {
				blurItem(views.text, views.label, value);
			},
			done: function (item, views, value) {
				markItem(item.elements.element, views.toggle, value);
				listCallbacks.nodeChange();
			},
			removeChild: function (item) {
				listCallbacks.nodeChange();
			},
			nodeChange: function () {
				lazy(function() {
					var getItems = list.getElementsByProperty,
						all = getItems().length,
						checked = getItems('done', true).length;

					renderFooter(ui.model[0].views, checked, all);
					renderLeft(ui.templates.itemsLeft.partials.self,
						ui.model[0].views.counter, all - checked);
					renderMarkAll(ui.model[0].views.toggle, all === checked);
				}, listCallbacks.nodeChange);
			}
		},

		ui = todo.component('app', {
			model: [{filter: getFilter(location.hash)}],
			eventListeners: {
				addItem: function (e, element, item) {
					var text = element.value.replace(/(?:^\s+|\s+$)/, '');

					if ((e.which === 13 || e.keyCode === 13) && text) {
						list.appendChild({
							text: text,
							done: false
						});
						element.value = '';
					}
				},
				sort: function (e, element, item) {
					if (e.keyCode === 38 && e.altKey) { // arrow up
						list.sortChildren(sortAsc);
					} else if (e.keyCode === 40 && e.altKey) { // arrow down
						list.sortChildren(sortDesc);
					}
				},
				deleteDone: function (e, element, item) {
					var items = list.getElementsByProperty('done', true);

					for (var n = items.length; n--; ) {
						list.removeChild(items[n]);
					}
				},
				toggleAll: function (e, element, item) {
					var checked = e.target.checked,
						items = list.getElementsByProperty('done', !checked);

					for (var n = items.length; n--; ) {
						items[n].done = checked;
					}
				},
				filter: function (e, element, item) {
					var value = getFilter(e.target.hash);

					renderFilters(item.views, value, item.filter);
					item.filter = value;
				}
			}
		});

	// --- INIT app
	listCallbacks.nodeChange(); // triggers rendering...
	renderFilters(ui.model[0].views, ui.model[0].filter);

	// --- VIEW functions: don't know about models etc...
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
		if (e.which === 27 || e.keyCode === 27) {
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

	// --- helper functions
	function getFilter(text) {
		return (text.split('#/')[1] || '').split('/')[0] || 'all';
	}

	function lazy(fn, obj) {
		clearTimeout(obj.timer);
		obj.timer = setTimeout(fn, 0);
	}
};