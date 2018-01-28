(function defineSchnauzer(root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root);
	} else if (typeof define === 'function' && define.amd) {
		define('schnauzer', [], function () {
			return factory(root);
		});
	} else {
		root.Schnauzer = factory(root);
	}
}(this, function SchnauzerFactory(root, undefined) {
	'use strict';
	// Schnauzer   4.00 KB,  1.77 KB vs
	// Mustage     5.47 KB,  2.26 KB vs
	// Handlebars 74.20 KB, 21.86 KB

	var Schnauzer = function(template, options) {
			this.version = '0.1.0';
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
				doEscape: true,
				helpers: {},
				partials: {},
				recursion: 'self',
				characters: '$"<>%-=@',
				splitter: '|##|'
			};
			init(this, options || {}, template);
		},
		init = function(_this, options, template) {
			for (var option in options) {
				_this.options[option] = options[option];
			}
			options = _this.options;
			_this.entityRegExp = (function(entityMap, output){
				for (var symbol in entityMap) {
					output += symbol; //.push(n);
				}
				return new RegExp('[' + output + ']', 'g');
			})(options.entityMap, []);
			_this.stopRegExp = new RegExp(/^\.+/);
			switchTags(_this, options.tags);
			_this.partials = {};
			for (var name in options.partials) {
				_this.registerPartial(name, options.partials[name]);
			}
			template && _this.registerPartial(options.recursion, template);
		},
		help = 1; // counter helper for nestings

	Schnauzer.prototype = {
		render: function(data, extra) {
			extra = extra && (isArray(extra) && extra || [extra]);
			return this.partials[this.options.recursion](data, extra);
		},
		parse: function(html) {
			this.partials[this.options.recursion] ||
				this.registerPartial(this.options.recursion, html);
		},
		registerHelper: function(name, fn) {
			this.options.helpers[name] = fn;
		},
		unregisterHelper: function(name) {
			delete this.options.helpers[name];
		},
		registerPartial: function(name, html) {
			return this.partials[name] = sizzleTemplate(this, html);
		},
		unregisterPartial: function(name) {
			delete this.options.partials[name];
		},
		setTags: function(tags) {
			switchTags(this, tags);
		}
	};

	return Schnauzer;

	function switchTags(_this, tags) {
		var isDefault = tags[0] === '{{',
			_tags = isDefault ? ['{{2,3}', '}{2,3}'] : tags;

		_this.options.tags = _tags;
		_this.variableRegExp = new RegExp('(' + _tags[0] + ')' +
			'([>!&=]\\s*)*([\\w\\'+ _this.options.characters +
			'\\.\\s*]+)*' + _tags[1], 'g');
		_this.sectionRegExp = new RegExp(
			_tags[0] + '(#|\\^)([\\w\\.]*)\\s*(.*?)' + _tags[1] +
			'([\\S\\s]*?)(' + _tags[0] + ')\\/\\2(' + _tags[1] + ')', 'g');
	}

	function isArray(obj) { //obj instanceof Array;
		return obj && obj.constructor === Array;
	}

	function isFunction(obj) {
		return obj && typeof obj === 'function';
	}

	function crawlObject(data, keys) { // faster than while
		for (var n = 0, m = keys.length; n < m; n++) {
			data = data && data[keys[n]];
		}
		return data;
	}

	function findData(data, dataTree, key) {
		if (typeof key !== 'string') {
			return;
		}
		var keys = [],
			value = data[key] !== undefined ? data[key] :
				crawlObject(data, keys = key.split('.'));

		if (value !== undefined) {
			return value;
		}
		for (var n = dataTree.length; n--; ) {
			if (dataTree[n][key] !== undefined) {
				return dataTree[n][key];
			}
			value = crawlObject(dataTree[n], keys);
			if (value) {
				return value;
			}
		}
	}

	function escapeHtml(string, _this) {
		return String(string).replace(_this.entityRegExp, function escape(char) {
			return _this.options.entityMap[char];
		});
	}

	function tools(_this, data, dataTree) {
		return {
			getData: function getData(key) {
				return findData(data, dataTree, key);
			},
			escapeHtml: function escape(string) {
				return escapeHtml(string, _this);
			}
		}
	}

	function variable(_this, html) {
		var keys = [],
			options = _this.options;

		html = html.replace(_this.variableRegExp,
			function(all, $1, $2, $3) {
				var isIgnore = $2 && ($2[0] === '!' || $2[0] === '='),
					isUnescaped = !options.doEscape ||
						$1 === '{{{' || $2 && $2[0] === '&',
					isPartial = $2 && $2[0] === '>',
					isSelf = false,
					name = '',
					_data = {};

				if (isIgnore) {
					return '';
				}
				$3 = $3.split(/\s+/); // split variables
				name = $3.shift($3);
				if (isPartial) { // convert variables
					for (var n = $3.length, parts = []; n--; ) {
						parts = $3[n].split('=');
						_data[parts[1] ? parts[0] : '$' + n] =
							(parts[1] ? parts[1] : parts[0]).replace(/"/g, '');
					}
				}
				isSelf = name === options.recursion;
				keys.push(isPartial && (_this.partials[name] || isSelf) ?
					[_this.partials[name], _data, isPartial, isUnescaped, isSelf] :
					[name, $3, null, isUnescaped]);
				return options.splitter;
			}).split(options.splitter);

		return function fastReplace(data, dataTree, _data) {
			if (_data) { // for partial
				dataTree = [_data].concat(dataTree);
			}
			for (var n = 0, l = html.length, out = '', tmp, key; n < l; n++) {
				out = out + html[n]; // out.push(html[n]);
				if (keys[n] === undefined) { // no other functions, just html
					continue;
				}
				key = keys[n][0];
				if (keys[n][2] === true) { // partial -> executor
					tmp = (key || _this.partials[options.recursion])(data,
						keys[n][4] ? null : dataTree, keys[n][1]);
				} else {
					tmp = data[key] !== undefined ? data[key] :
						findData(data, dataTree, key); // walk up tree
					tmp = options.helpers[key] ? // helpers
						options.helpers[key].apply(tools(_this, data, dataTree),
							[''].concat(keys[n][1])) :
						isFunction(tmp) ? tmp.apply(tools(_this, data, dataTree),
							[''].concat(keys[n][1])) : // inline function
						key.name === 'executor' ?
						key(data, dataTree) : tmp && (keys[n][3] ? tmp :
						escapeHtml(tmp, _this));
				}
				tmp !== undefined && (out = out + tmp); // out.push(tmp);
			}
			return out; //.join('');
		};
	}

	function section(_this, func, key, _key, negative) {
		return function fastLoop(data, dataTree, foundData) {
			var _data = findData(data, dataTree, key); // TODO: check a.b.c.

			if (isArray(_data)) { // array
				if (negative) {
					return !_data.length ? func(_data, dataTree) : '';
				}
				for (var n = 0, l = _data.length, out = ''; n < l; n++) {
					out = out + (typeof _data[n] === 'object' ?
						func(_data[n], [_data[n]].concat(data)) :
						func({'.': _data[n]}, dataTree));
				}
				return out; //.join('');
			}
			if (_this.options.helpers[key]) { // helpers
				return _this.options.helpers[key].apply(tools(_this, data, dataTree),
					[func(data, dataTree)].concat(_key.split(/\s+/)));
			}
			foundData = data[key] || _data;
			if (foundData && isFunction(foundData)) { // functions
				return foundData.apply(tools(_this, data, dataTree),
					[func(data, dataTree)].concat(_key.split(/\s+/)));
			}
			if (negative && !foundData || !negative && foundData) { // regular replace
				return func(data, dataTree);
			}
		}
	}

	function sizzleTemplate(_this, html) {
		var options = _this.options,
			partCollector = [],
			output = [],
			nesting = [],
			counter = -1,
			stop = '',
			parts = html.replace(_this.sectionRegExp, function(_, $1, $2, $3, $4, $5, $6) {
				var replacer = $5 + $1 + $2,
					index = $4.lastIndexOf(replacer);

				if (nesting.length) return _; // skip for next replace
				counter++;
				if (index !== -1) { // only if nesting occures
					nesting.push(counter--);
					stop = Array(++help).join('.');
					return replacer + $3 + $6 + $4.substring(0, index) + $5 + $1 + stop + $2 +
						$4.substring(index + replacer.length) + $5 + '/' + stop + $2 + $6;
				}
				$2 = $2.replace(_this.stopRegExp, '');

				partCollector.push(new RegExp(options.tags[0] + '[#\^]').test($4) ?
					section(_this, sizzleTemplate(_this, $4), $2, $3, $1 === '^') :
					section(_this, variable(_this, $4), $2, $3, $1 === '^'));
				return options.splitter;
			}).split(options.splitter);

		for (var n = 0, l = nesting.length; n < l; n++) {
			parts[nesting[n]] = sizzleTemplate(_this, parts[nesting[n]]);
		}
		for (var n = 0, l = parts.length; n < l; n++) { // rearrange
			output.push(isFunction(parts[n]) ? parts[n] : variable(_this, parts[n]));
			partCollector[n] && output.push(partCollector[n]);
		}

		return function executor(data, dataTree, keys) {
			for (var n = 0, l = output.length, out = ''; n < l; n++) {
				out = out + (output[n](data, dataTree || [data], keys) || '');
			}
			return out; // .join('');
		}
	}
}));
