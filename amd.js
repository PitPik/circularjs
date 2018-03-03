!(function (root) {
	'use strict';
	// TODO: whole thing is not done yet...
	// TODO: anonymous modules don't know how to set .done correctly (resolves though)
	// 7.06 KB, 2.62 KB, 1.09 KB (-84.62%) vs. 17.66 KB, 6.55 KB
	var _config = root.require || {}, // we got this from amd.config.js
		_rand = root.Math.random, // for faster access
		_documentFragment = null, // used in appendScript() ...
		_timer = 0, // ... same here
		_foo = {},
		_link = document.createElement('a'),
		extend = function(oldObj, newObj) {
			if (typeof newObj !== "object" || !newObj) return newObj;
			oldObj = oldObj || {};
			for (var key in newObj) {
				oldObj[key] = newObj[key].constructor === Array ? newObj[key] :
					typeof newObj[key] === 'object' ?
					extend(oldObj[key], newObj[key]) : newObj[key];
			}
			return oldObj;
		},
		applyConfiguration = function(config) {
			var parts = ['lookaheadMap', 'paths', 'options', 'baseUrl'];
			for (var n = parts.length; n--; ) { // apply white-list
				require[parts[n]] = extend(require[parts[n]], config[parts[n]]) ||
					require[parts[n]] || '';
			}
		},
		getListIndex = function(list, item) { // for old IE ([].indexOf())
			for (var n = list.length; n--; ) { // IDs don't compete -> inv. = ok
				if (list[n] === item) {
					return n;
				}
			}
			return -1;
		},
		getPathFromName = function(name, _path, _postFix) {
			_postFix = /(?:^\!|^http[s]*:|.*\.js$)/.test(name) ? '' : '.js';
			name = (require.paths[name] || name).replace(/^\!/, '');
			_path = normalizePath((require.baseUrl || '.') + '/' +
				name + _postFix).replace(/^.\//, '');

			return _path;
		},
		normalizePath = function(path) {
			_link.href = path;
			return _link.pathname;
		},
		applyScript = function(module, sync) { // creates script tag
			var script = root.document.createElement('script');

			script.type = 'text/javascript';
			script.async = script.defer = !sync ? true : false;
			script.charset = 'utf-8';
			script.onload = script.onreadystatechange = function(e) {
				if (e.type === 'load' || (e.currentTarget || e.srcElement)
						.readyState === 'complete') {
					if (!module.factory) {
						// if(_foo) {
						//     module.factory = _foo.factory;
						//     _foo = {};
						// }
						markAsDone(module);
					}
					script.onload = script.onreadystatechange = null;
				}
			};
			script.src = module.path;
			return script;
		},
		appendScript = function(script) { // appends script tags to head
			_documentFragment = _documentFragment ||
				root.document.createDocumentFragment();
			_documentFragment.appendChild(script);
			clearTimeout(_timer);
			_timer = setTimeout(function appendScripts() {
				document.head.appendChild(_documentFragment);
			}, 0);
		},
		checkIfModuleIsDone = function(module) {
			for (var count = 0, n = module.resolvedDeps.length; n--; ) {
				module.resolvedDeps[n] !== undefined && count++;
			}
			module.deps.length === count && markAsDone(module);
		},
		notifyCaller = function(dep) {
			var module = null;

			for (var index = 0, n = 0, m = dep.parentNames.length; n < m; n++) {
				module = modules[dep.parentNames[n]];
				index = getListIndex(module.deps, dep.name); // TODO: strip path
				module.resolvedDeps[index] = dep.done;
				!module.done && checkIfModuleIsDone(module);
			}
			dep.parentNames = [];
		},
		markAsDone = function(module) { // culd be called more than once on same
			// setTimeout(function(){
			if (!module.done) {
				module.done = (module.factory || function(){})
					.apply(null, module.resolvedDeps); // TODO: function(){}
			}
			notifyCaller(module);
			if (!require.options.debug) { // clean up
				delete module.factory;
				// delete module.resolvedDeps;
				if (module.name.indexOf('_mod') === 0) {
					// delete modules[module.name];
				}
			}
			// }, 0);
		},
		lookaheadForDeps = function(name) {
			var deps = require.lookaheadMap[name];

			if (deps && (require.paths[name] || '')
					.indexOf(require.options.minifyPrefix) === -1) {
				require(deps);
				for (var n = 0, m = deps.length; n < m; n++) {
					if (require.lookaheadMap[deps[n]]) {
						!modules[deps[n]] && lookaheadForDeps(deps[n]);
					}
				}
			}
		};

	if (!root.define || !root.define.amd) {
		var define = root.define = function define(name, deps, factory, sync) {
				var parentNames = [];

				if (typeof name !== 'string') { // UUUUAAAAAAHHHHHHH
					_foo = require(name, deps, factory); // shifting params
					return _foo;
				}

				if (modules[name]) {
					if (modules[name].done) {
						notifyCaller(modules[name]);
						return modules[name].done;
					}
					modules[name].deps = deps;
					modules[name].factory = factory;
				} else {
					modules[name] = {
						name: name,
						deps: deps,
						factory: factory,
						resolvedDeps: [],
						parentNames: []
					};
				}

				for (var n = 0, m = deps.length; n < m; n++) {
					parentNames = modules[deps[n]] &&
						modules[deps[n]].parentNames;

					if (!modules[deps[n]]) {
						modules[deps[n]] = {
							name: deps[n],
							isFile: deps[n].substr(0, 1) === '!',
							path: getPathFromName(deps[n]),
							resolvedDeps: [],
							parentNames: [name]
						};
						if (modules[deps[n]].isFile) {
							require.getFile(modules[deps[n]], markAsDone);
						} else {
							appendScript(applyScript(modules[deps[n]], sync));
							lookaheadForDeps(deps[n]);
						}
					} else if (getListIndex(parentNames, name) === -1) {
						parentNames.push(name);
					}
					modules[deps[n]].done && notifyCaller(modules[deps[n]]);
				}

				checkIfModuleIsDone(modules[name]);
				return modules[name];
			},
			require = root.require = function require(deps, factory, sync) {
				return deps.constructor === Array ? // deps is also optional
					define('_mod' + (_rand() + _rand()), deps, factory, sync) :
					define('_mod' + (_rand() + _rand()), [], deps, factory);
			},
			modules      = require.modules   = {},
			config       = require.config    = function(options) {
				applyConfiguration(_config = options);
			};

		// see Toolbox for require.getFile
		require.getFile = function(resource, markAsDone) { return resource; };
		define.amd = {}; // what are we gonna do with this?
		config(_config);
	}
})(this);