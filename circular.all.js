!function(root) {
    "use strict";
    var mathRand = root.Math.random;
    var link = document.createElement("a");
    var documentFragment = root.document.createDocumentFragment();
    var timer = 0;
    var modules = require.modules = {};
    var executedModule = {};
    define.amd = {};
    require.config = config;
    require.getFile = function(resource, markAsDone) {
        return resource;
    };
    root.define = define;
    root.require = require;
    config({});
    function getRandomName() {
        return "_module_" + (mathRand() + mathRand());
    }
    function normalizePath(path) {
        link.href = path;
        return (path.indexOf(link.host) !== -1 ? link.origin : "") + link.pathname + link.search;
    }
    function getPathFromName(name) {
        var postFix = /(?:^\!|^http[s]*:|.*\.js$)/.test(name) ? "" : ".js";
        name = (require.paths[name] || name).replace(/^\!/, "");
        return normalizePath((require.baseUrl || ".") + "/" + name + postFix).replace(/^.\//, "");
    }
    function config(config) {
        var items = [ "lookaheadMap", "paths", "options", "baseUrl|string" ];
        if (!require[items[0]]) {
            for (var n = items.length, value = []; n--; ) {
                value = items[n].split("|");
                require[value[0]] = value[1] === "string" ? "" : {};
            }
        }
        for (var item in config) {
            if (items.indexOf(item) === -1) continue;
            for (var key in config[item]) {
                require[item][key] = config[item][key];
            }
        }
    }
    function lookaheadForDeps(name) {
        var deps = require.lookaheadMap[name];
        var minifyPrefix = require.options.minifyPrefix;
        if (!deps || (require.paths[name] || "").indexOf(minifyPrefix) !== -1) {
            return;
        }
        require(deps);
        for (var n = 0, m = deps.length; n < m; n++) {
            if (!modules[deps[n]]) {
                lookaheadForDeps(deps[n]);
            }
        }
    }
    function checkIfDone(module) {
        var deps = module.deps;
        var done = true;
        for (var n = deps.length; n--; ) {
            if (modules[deps[n]] && modules[deps[n]].done === undefined) {
                done = false;
            }
        }
        if (done) markAsDone(module);
    }
    function markAsDone(module) {
        var parents = module.parents || [];
        if (module.factory && !module.isFile) {
            module.done = module.factory.apply(null, module.deps.map(function(dep) {
                return modules[dep].done;
            }));
            delete module.factory;
        } else if (module.done === undefined) {
            delete modules[module.name];
        }
        for (var n = parents.length; n--; ) {
            if (modules[parents[n]]) {
                checkIfDone(modules[parents[n]]);
            }
        }
    }
    function appendScript(script) {
        documentFragment.appendChild(script);
        clearTimeout(timer);
        timer = setTimeout(function() {
            document.head.appendChild(documentFragment);
        });
    }
    function applyScript(module, sync) {
        var script = root.document.createElement("script");
        script.type = "text/javascript";
        script.async = script.defer = !sync ? true : false;
        script.charset = "utf-8";
        script.onload = script.onreadystatechange = function(data) {
            return function(e) {
                var target = e.currentTarget || e.srcElement;
                if (e.type === "load" || target.readyState === "complete") {
                    script.onload = script.onreadystatechange = null;
                    onScriptLoaded(data);
                }
            };
        }(module);
        script.src = module.path;
        return script;
    }
    function onScriptLoaded(module) {
        var module = modules[module.name];
        if (executedModule.name.indexOf("_module_") === 0) {
            module.done = executedModule.done;
            module.factory = executedModule.factory;
            module.deps = executedModule.deps;
            for (var n = module.deps.length, parents = {}; n--; ) {
                parents = modules[module.deps[n]].parents;
                parents[parents.indexOf(executedModule.name)] = module.name;
            }
            delete modules[executedModule.name];
        }
        checkIfDone(module);
    }
    function getDependencies(parentName, deps, sync) {
        for (var n = deps.length, module = {}, name = ""; n--; ) {
            name = deps[n];
            if (modules[name]) {
                modules[name].parents.push(parentName);
                continue;
            }
            module = modules[name] = {
                name: name,
                isFile: name.charAt(0) === "!",
                path: getPathFromName(name),
                parents: [ parentName ]
            };
            if (module.isFile) {
                require.getFile(module, markAsDone);
            } else {
                appendScript(applyScript(module, sync));
                lookaheadForDeps(name);
            }
        }
    }
    function require(deps, factory, sync) {
        deps.constructor === Array ? define(getRandomName(), deps, factory, sync) : define(getRandomName(), [], deps, factory);
    }
    function define(name, deps, factory, sync) {
        var module = {};
        if (typeof name !== "string") {
            return require(name, deps, factory);
        }
        name = name || getRandomName();
        module = modules[name];
        getDependencies(name, deps, sync);
        if (module) {
            module.deps = deps;
            module.factory = factory;
        } else {
            module = modules[name] = {
                name: name,
                deps: deps,
                factory: factory,
                parents: []
            };
            checkIfDone(module);
        }
        executedModule = module;
    }
}(this);

(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory(root);
    } else if (typeof define === "function" && define.amd) {
        define("toolbox", [], function() {
            return factory(root);
        });
    } else {
        root.Toolbox = factory(root);
    }
})(this, function(window, undefined) {
    "use strict";
    var resourceCache = null, _link = document.createElement("a"), types = {
        undefined: undefined,
        null: null,
        NaN: NaN,
        true: true,
        false: false
    }, Toolbox = {
        convertToType: function(value) {
            return types.hasOwnProperty(value) ? types[value] : value.toString && +value.toString() === value ? +value : value;
        },
        closest: function(element, selector, root) {
            if (element.closest) {
                Toolbox.closest = function(element, selector) {
                    return element.closest(selector);
                };
            } else {
                var matches = element.msMatchesSelector || element.webkitMatchesSelector || element.matches;
                Toolbox.closest = function(element, selector) {
                    if (!(root || document.documentElement).contains(element)) return null;
                    do {
                        if (matches.call(element, selector)) return element;
                        element = element.parentElement || element.parentNode;
                    } while (element !== null && element.nodeType === 1);
                    return null;
                };
            }
            return Toolbox.closest(element, selector, root);
        },
        $: function(selector, root) {
            return (root || document).querySelector(selector);
        },
        $$: function(selector, root) {
            return (root || document).querySelectorAll(selector);
        },
        parentsIndexOf: function(elements, target) {
            for (var n = elements.length; n--; ) {
                if (elements[n].contains(target)) {
                    return n;
                }
            }
            return -1;
        },
        keys: function(obj) {
            var result = [];
            for (var key in obj) if (obj.hasOwnProperty(key)) result.push(key);
            return result;
        },
        addClass: function(element, className) {
            element && element.classList.add(className);
        },
        removeClass: function(element, className) {
            element && element.classList.remove(className);
        },
        toggleClass: function(element, className, condition) {
            if (!element) return;
            var hasClass = element.classList.contains(className);
            if (hasClass && !condition) {
                element.classList.remove(className);
            } else if (!hasClass && condition !== false) {
                element.classList.add(className);
            }
        },
        hasClass: function(element, className) {
            return element && element.classList.contains(className);
        },
        toggleClasses: function(oldElm, newElm, oldClass, newClass) {
            oldElm && oldClass && Toolbox.removeClass(oldElm, oldClass);
            newElm && Toolbox.addClass(newElm, newClass || oldClass);
        },
        addEvents: function(elements, type, func, cap) {
            var collection = [];
            for (var n = elements.length; n--; ) {
                collection.push(Toolbox.addEvent(elements[n], type, func, cap));
            }
            return collection;
        },
        removeEvents: function(collection) {
            for (var n = collection.length; n--; ) {
                collection[n]();
            }
        },
        addEvent: function(element, type, func, cap) {
            cap = cap !== undefined ? cap : /(?:focus|blur|mouseenter|mouseleave)/.test(type) ? true : false;
            element.addEventListener(type, func, cap);
            return function removeEvent() {
                element.removeEventListener(type, func, cap);
            };
        },
        storageHelper: {
            fetch: function(key) {
                var data = localStorage.getItem(key);
                return data ? JSON.parse(data) : data;
            },
            saveLazy: function(data, key, obj) {
                Toolbox.lazy(function() {
                    Toolbox.storageHelper.save(data, key);
                }, obj || Toolbox.storageHelper);
            },
            save: function(data, key) {
                localStorage.setItem(key, JSON.stringify(data));
            }
        },
        lazy: function(fn, obj, pref) {
            clearTimeout(obj._timer);
            obj._timer = setTimeout(fn, 0, pref);
        },
        itemsSorter: function(a, b, type, asc) {
            var textA = a[type].toUpperCase();
            var textB = b[type].toUpperCase();
            return asc ? textA < textB ? 1 : textA > textB ? -1 : 0 : textA < textB ? -1 : textA > textB ? 1 : 0;
        },
        normalizePath: function(path) {
            _link.href = path;
            return (path.indexOf(_link.host) !== -1 ? _link.origin : "") + _link.pathname + _link.search;
        },
        ajax: function(url, prefs) {
            var promise = null;
            var cache = false;
            var now = new Date().getTime();
            var time = 0;
            prefs = prefs || {};
            url = Toolbox.normalizePath(url);
            time = ajaxCache[url] && ajaxCache[url].time || 0;
            cache = prefs.cache === true ? now + 1e8 : !prefs.cache ? 0 : time > now ? time : now + prefs.cache;
            promise = cache && !prefs.resetCache && time > now ? ajaxCache[url] : null;
            promise = promise || new Toolbox.Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                var method = (prefs.method || prefs.type || "GET").toUpperCase();
                if (!xhr) {
                    reject("Giving up :( Cannot create an XMLHTTP instance");
                }
                if (!prefs) {
                    prefs = url;
                    url = prefs.url;
                }
                xhr.onreadystatechange = function() {
                    var data = getXHRData(this, prefs.dataType, reject);
                    if (data !== undefined) {
                        if (prefs.dataType === "json") {
                            try {
                                data = JSON.parse(data);
                            } catch (e) {
                                reject("Caught Exception: " + e.stack);
                                return;
                            }
                        }
                        resolve(data);
                    }
                };
                xhr.open(method, url, prefs.async || true, prefs.username, prefs.password);
                if (prefs.dataType === "xml") {
                    xhr.setRequestHeader("Content-Type", "text/xml");
                }
                if (method !== "GET" && prefs.csrf) {
                    xhr.setRequestHeader("X-CSRF-Token", getCSRFToken(prefs.csrf));
                }
                if (prefs.headers) {
                    for (var header in prefs.headers) {
                        xhr.setRequestHeader(header, prefs.headers[header]);
                    }
                }
                xhr.send(prefs.data);
                return function abortXHR() {
                    xhr.abort();
                };
            });
            if (cache) {
                ajaxCache[url] = promise;
                ajaxCache[url].time = cache;
            } else {
                delete ajaxCache[url];
            }
            return promise;
        },
        errorHandler: function(e) {
            console.error(e);
        },
        Promise: Promise,
        requireResources: function(data, type, container) {
            var promises = [];
            var item = null;
            var resourceName = "";
            var absolute = false;
            var path = "";
            var text = "";
            var isStyles = type === "styles";
            var attribute = isStyles ? "href" : "src";
            var items = isStyles ? data.styleSheets : data.scripts;
            var cache = resourceCache = resourceCache || Toolbox.captureResources();
            while (item = items.shift()) {
                resourceName = item.getAttribute(attribute);
                absolute = resourceName && resourceName.indexOf("://") !== -1;
                path = Toolbox.normalizePath(data.path && !absolute ? data.path + "/" + resourceName : "" + resourceName);
                if (resourceName && cache[path]) continue;
                if (!isStyles) {
                    text = item.text;
                    item = document.createElement("script");
                    item.setAttribute("type", "text/javascript");
                    item.async = true;
                    if (!resourceName) {
                        item.text = text;
                    }
                }
                if (resourceName) {
                    item[attribute] = path;
                    document.head.appendChild(item);
                    cache[path] = item;
                }
                promises.push(new Toolbox.Promise(function(resolve) {
                    if (resourceName && item.onload !== undefined) {
                        item.onload = function() {
                            resolve(this);
                        };
                    } else {
                        !resourceName && (isStyles ? container : document.body).appendChild(item);
                        resolve(item);
                    }
                }));
            }
            return Toolbox.Promise.all(promises);
        },
        captureResources: function() {
            var cache = {};
            var resources = [].slice.call(document.scripts).concat([].slice.call(Toolbox.$$("link", document)));
            var path = "";
            for (var n = resources.length; n--; ) {
                path = resources[n].getAttribute("src") || resources[n].getAttribute("href");
                if (path) {
                    path = Toolbox.normalizePath(path);
                    cache[path] = resources[n];
                }
            }
            return cache;
        }
    };
    window.Event = window.Event || function Event(event, params) {
        var evt = document.createEvent("CustomEvent");
        params = params || {};
        evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail);
        return evt;
    };
    var ajaxCache = {};
    function getCSRFToken(cookieKey) {
        var start = document.cookie.split(cookieKey + "=")[1];
        return start && start.split(";")[0];
    }
    function getXHRData(xhr, dataType, reject) {
        try {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status < 200 || xhr.status > 299) {
                    var error = new Error(xhr.statusText);
                    error.response = xhr.response;
                    reject(error);
                } else {
                    return xhr[dataType === "xml" ? "responseXML" : "responseText"];
                }
            }
        } catch (e) {
            reject("Caught Exception: " + e.stack);
        }
    }
    function Promise(fn) {
        this._state = 0;
        this._handled = false;
        this._value = undefined;
        this._deferreds = [];
        this._returnFn = doResolve(fn, this);
    }
    Promise._cache = {};
    function handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }
        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }
        self._handled = true;
        setTimeout(function() {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            var ret;
            if (cb === null) {
                (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
                return;
            }
            try {
                ret = cb(self._value);
            } catch (e) {
                reject(deferred.promise, e);
                return;
            }
            resolve(deferred.promise, ret);
        });
    }
    function resolve(self, newValue) {
        try {
            if (newValue) {
                var then = newValue.then;
                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === "function") {
                    return doResolve(then.bind(newValue), self);
                }
            }
            self._state = 1;
            self._value = newValue;
            finale(self);
        } catch (e) {
            reject(self, e);
        }
    }
    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }
    function finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
            setTimeout(function() {
                if (!self._handled) {
                    console.warn("Possible Unhandled Promise Rejection:", self._value);
                }
            });
        }
        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }
    function doResolve(fn, self) {
        var done = false;
        var rejectFn = function(value) {
            if (done) return;
            done = true;
            reject(self, value);
        };
        try {
            return fn(function(value) {
                if (done) return;
                done = true;
                resolve(self, value);
            }, rejectFn);
        } catch (ex) {
            rejectFn(ex);
        }
    }
    Promise.prototype["catch"] = function(onRejected) {
        return this.then(null, onRejected || function(error) {
            console.error(error);
        });
    };
    Promise.prototype.then = function(onFulfilled, onRejected) {
        var _returnFn = this._returnFn;
        var promise = new Promise(function() {
            return _returnFn;
        });
        handle(this, {
            onFulfilled: onFulfilled || null,
            onRejected: onRejected || null,
            promise: promise
        });
        return promise;
    };
    Promise.prototype.cancel = function(id) {
        var promise = Promise._cache[id];
        Promise._cache[id] = this;
        if (!promise) return this;
        if (promise._state !== 1) {
            if (promise._returnFn && typeof promise._returnFn === "function") {
                promise._returnFn();
            }
            promise._deferreds = [];
            promise.then = promise["catch"] = function() {};
            promise._handled = true;
            promise._state = 1;
        }
        promise._returnFn = null;
        return this;
    };
    Promise.all = function(promises) {
        var results = [];
        var merged = promises.reduce(function(accumulator, promise) {
            return accumulator.then(function() {
                return promise;
            }).then(function(result) {
                return results.push(result);
            });
        }, new Promise(function(resolve, reject) {
            resolve(null);
        }));
        return merged.then(function() {
            return results;
        });
    };
    if (window.require) {
        require.getFile = function(resource, markAsDone) {
            Toolbox.ajax(resource.path, {
                cache: resource.name.substr(0, 2) !== "!!"
            }).then(function(data) {
                resource.done = data;
                markAsDone(resource);
            });
        };
    }
    return Toolbox;
});

(function defineSchnauzer(root, factory) {
    if (typeof exports === "object") module.exports = factory(root); else if (typeof define === "function" && define.amd) define("schnauzer", [], function() {
        return factory(root);
    }); else root.Schnauzer = factory(root);
})(this, function SchnauzerFactory(root, undefined) {
    "use strict";
    var Schnauzer = function(template, options) {
        this.version = "1.3.0";
        this.options = {
            tags: [ "{{", "}}" ],
            entityMap: {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
                "/": "&#x2F;",
                "`": "&#x60;",
                "=": "&#x3D;"
            },
            doEscape: true,
            helpers: {},
            decorators: {},
            partials: {},
            recursion: "self",
            characters: '$"<>%-=@',
            splitter: "|##|",
            tools: undefined,
            render: undefined
        };
        init(this, options || {}, template);
    }, init = function(_this, options, template) {
        for (var option in options) {
            _this.options[option] = options[option];
        }
        options = _this.options;
        _this.entityRegExp = new RegExp("[" + getKeys(options.entityMap, []).join("") + "]", "g");
        switchTags(_this, options.tags);
        _this.helpers = options.helpers;
        _this.decorators = options.decorators;
        _this.partials = {};
        for (var name in options.partials) {
            _this.registerPartial(name, options.partials[name]);
        }
        if (template) {
            _this.registerPartial(options.recursion, template);
        }
    }, isArray = Array.isArray || function(obj) {
        return obj && obj.constructor === Array;
    }, isFunction = function(obj) {
        return obj && typeof obj === "function";
    }, getKeys = Object.keys || function(obj, keys) {
        for (var key in obj) {
            obj.hasOwnProperty(key) && keys.push(key);
        }
        return keys;
    };
    Schnauzer.prototype = {
        render: function(data, extra) {
            return this.partials[this.options.recursion](data, extra);
        },
        parse: function(text) {
            return this.registerPartial(this.options.recursion, text);
        },
        registerHelper: function(name, fn) {
            this.helpers[name] = fn;
        },
        unregisterHelper: function(name) {
            delete this.helpers[name];
        },
        registerDecorator: function(name, fn) {
            this.decorators[name] = fn;
        },
        unregisterDecorator: function(name, fn) {
            delete this.decorators[name];
        },
        registerPartial: function(name, text) {
            return this.partials[name] = this.partials[name] || typeof text === "function" ? text : sizzleTemplate(this, text, []);
        },
        unregisterPartial: function(name) {
            delete this.partials[name];
        },
        setTags: function(tags) {
            switchTags(this, tags);
        }
    };
    return Schnauzer;
    function switchTags(_this, tags) {
        var _tags = tags[0] === "{{" ? [ "{{2,3}", "}{2,3}" ] : tags;
        var chars = _this.options.characters + "\\][";
        _this.inlineRegExp = new RegExp("(" + _tags[0] + ")" + "([>!&=])*\\s*([\\w\\" + chars + "\\.]+)\\s*([\\w" + chars + "|\\.\\s]*)" + _tags[1], "g");
        _this.sectionRegExp = new RegExp("(" + _tags[0] + ")([#^][*%]*)\\s*([\\w" + chars + "]*)" + "(?:\\s+([\\w$\\s|./" + chars + "]*))*(" + _tags[1] + ")((?:(?!\\1[#^])[\\S\\s])*?)" + "\\1\\/\\3\\5", "g");
        _this.elseSplitter = new RegExp(_tags[0] + "else" + _tags[1]);
    }
    function concat(array, newArray) {
        for (var n = 0, l = array.length; n < l; n++) {
            newArray[newArray.length] = array[n];
        }
        return newArray;
    }
    function getSource(data, extra, newData, helpers) {
        var hasNewData = newData !== undefined;
        var isNew = !data.__schnauzerData;
        var _extra = hasNewData && !isNew && data.extra || [];
        var _helpers = !isNew && data.helpers || [];
        return {
            extra: extra ? concat(extra, _extra) : _extra,
            path: isNew ? [ data ] : hasNewData ? concat(data.path, [ newData ]) : data.path,
            helpers: helpers ? concat(_helpers, hasNewData && [ helpers ] || [ {} ]) : _helpers,
            __schnauzerData: true
        };
    }
    function crawlObjectUp(data, keys) {
        for (var n = 0, m = keys.length; n < m; n++) {
            if (keys[n] === "./") continue;
            data = data && data[keys[n]];
        }
        return data;
    }
    function check(data, altData, keys) {
        return data !== undefined ? data : keys ? crawlObjectUp(altData, keys) : altData;
    }
    function findData(data, key, keys, pathDepth) {
        if (!keys) {
            return;
        }
        var _data = data.path[pathDepth] || {};
        var helpers = data.helpers[pathDepth] || {};
        var value = check(helpers[key], helpers, keys);
        if (value === undefined) {
            value = crawlObjectUp(_data, keys);
        }
        if (value !== undefined) {
            return value;
        }
        for (var n = data.extra.length; n--; ) {
            value = check(data.extra[n][key], data.extra[n], keys);
            if (value !== undefined) {
                return value;
            }
        }
    }
    function getVar(text) {
        if (!text) {
            return {};
        }
        var parts = text.split("=");
        var value = parts.length > 1 ? parts[1] : parts[0];
        var valueCharAt0 = value.charAt(0);
        var isString = valueCharAt0 === '"' || valueCharAt0 === "'";
        var isInline = false;
        var depth = 0;
        var keys = [];
        var path = [];
        var strict = false;
        var active = value.charAt(1) === "%" ? 2 : valueCharAt0 === "%" ? 1 : 0;
        if (isString) {
            value = value.replace(/(?:^['"]|['"]$)/g, "");
        } else {
            value = active ? value.substr(active) : value;
            path = value.split("../");
            if (path.length > 1) {
                value = (path[0] === "@" && "@" || "") + path.pop();
                depth = path.length;
            }
            keys = value.split(/[\.\/]/);
            value = value.replace(/^(\.\/|this\.|this\/|\*)/, function(all, $1) {
                if ($1 === "*") {
                    isInline = true;
                    return "";
                }
                strict = true;
                keys[0] = "./";
                return "";
            }).replace(/(?:^\[|\]$)/g, "");
        }
        return {
            name: parts.length > 1 ? parts[0] : value,
            value: value,
            isActive: active,
            isString: isString,
            isInline: isInline,
            strict: strict,
            keys: keys,
            depth: depth
        };
    }
    function escapeHtml(string, _this) {
        return String(string).replace(_this.entityRegExp, function(char) {
            return _this.options.entityMap[char];
        });
    }
    function apply(_this, fn, name, params, data, parts, body, altBody) {
        return _this.options.tools ? _this.options.tools(_this, findData, getSource, fn, name, params, data, parts, body, altBody) : fn[isArray(params) || parts.isInline ? "apply" : "call"]({
            getData: function getData(key) {
                key = parts.rawParts[key] || {
                    value: key,
                    keys: [ key ],
                    depth: 0
                };
                return key.isString ? key.value : findData(data, key.value, key.keys, key.depth);
            },
            escapeHtml: function escape(string) {
                return escapeHtml(string, _this);
            },
            getBody: function() {
                return body && body(data) || "";
            },
            gatAltBody: function() {
                return altBody && altBody(data) || "";
            }
        }, parts.isInline ? [ function() {
            return body || "";
        }, parts.parts, _this ] : params);
    }
    function render(_this, part, data, fn, text, value, type) {
        var name = part.name;
        value = check(value, "");
        return _this.options.render ? apply(_this, _this.options.render, name, {
            name: name,
            data: data,
            section: !!part.section,
            partial: !!part.partial,
            isActive: part.isActive,
            fn: fn,
            text: text,
            value: value,
            parent: part.parent,
            type: part.isInline && _this.decorators[name] && "decorator" || part.partial && _this.partials[name] && "partial" || _this.helpers[name] && "helper" || type || ""
        }, data, part, fn) : text + value;
    }
    function splitVars(_this, vars, _data, unEscaped, char0) {
        var parts = {};
        var rawParts = {};
        var helpers = [];
        for (var n = 0, l = vars.length, tmp = {}; n < l; n++) {
            if (vars[n] === "") continue;
            if (vars[n] === "as") {
                vars.splice(n, 1);
                helpers = [ vars.splice(n, 1)[n], vars.splice(n, 1)[n] ];
                break;
            }
            tmp = getVar(vars[n]);
            parts[tmp.name] = tmp;
            rawParts[vars[n]] = tmp;
        }
        return {
            name: _data.name,
            vars: vars,
            parts: parts,
            rawParts: rawParts,
            partial: char0 === ">",
            isInline: _data.isInline,
            isUnescaped: !_this.options.doEscape || char0 === "&" || unEscaped,
            isActive: _data.isActive,
            depth: _data.depth,
            strict: _data.strict,
            keys: _data.keys,
            helpers: helpers
        };
    }
    function createHelper(value, name, parent, helperData, len, n) {
        var helpers = len ? {
            "@index": n,
            "@last": n === len - 1,
            "@first": n === 0,
            _parent: parent && [ parent.name, n ]
        } : {};
        helpers["@key"] = name;
        helpers["."] = helpers["this"] = value;
        if (helperData.length !== 0) {
            helpers[helperData[0]] = value;
            helpers[helperData[1]] = name;
        }
        return helpers;
    }
    function inline(_this, text, sections, extType) {
        var parts = [];
        var splitter = _this.options.splitter;
        text = text.replace(_this.inlineRegExp, function(all, start, type, name, vars) {
            var char0 = type && type.charAt(0) || "";
            if (char0 === "!" || char0 === "=") {
                return "";
            }
            vars = vars.split(/\s+/);
            if (name === "-section-") {
                name = getVar(vars[1]);
                name.section = vars[0];
                parts.push(name);
                return splitter;
            }
            if (name === "*") {
                name = name + vars.shift();
            }
            parts.push(splitVars(_this, vars, getVar(name), start === "{{{", char0));
            return splitter;
        }).split(splitter);
        extType = getVar(extType).name;
        return function fastReplace(data, loopData) {
            return replace(_this, data, text, sections, extType, parts, loopData);
        };
    }
    function replace(_this, data, text, sections, extType, parts, loopData) {
        var out = "";
        var _out = "";
        var _fn = null;
        var _data = {};
        var part = {};
        var helper = {};
        var atom;
        for (var n = 0, l = text.length; n < l; n++) {
            part = parts[n];
            if (part === undefined) {
                out = extType ? render(_this, {}, data, _fn, out, text[n], extType) : out + text[n];
                continue;
            }
            out = out + text[n];
            if (part.section) {
                part.parent = loopData && crawlObjectUp(data.helpers, [ 0, "_parent" ]);
                out = render(_this, part, data, _fn = sections[part.section], out, _fn(data, loopData), extType);
                continue;
            }
            if (part.isInline) {
                out = apply(_this, _this.decorators[part.name || part.vars[0]], part.name, part.vars, data, part, out) || out;
                if (isFunction(out)) {
                    out = out();
                }
                continue;
            }
            if (part.partial) {
                helper = data.helpers[0] || (data.helpers[0] = {});
                atom = undefined;
                for (var key in part.parts) {
                    atom = part.parts[key];
                    helper[key] = atom.keys.length && findData(data, atom.name, atom.keys, atom.depth) || atom.isString && (atom.value || atom.name);
                }
                _out = _this.partials[part.name](data);
            } else {
                part.parent = loopData && crawlObjectUp(data.helpers, [ 0, "_parent" ]);
                _fn = _replace(_this, part);
                _out = _fn(data);
            }
            out = render(_this, part, data, _fn, out, _out, extType);
        }
        return out;
    }
    function _replace(_this, part) {
        return function(data, keys) {
            var out = findData(data, part.name, keys || part.keys, part.depth);
            var fn = !part.strict && (_this.helpers[part.name] || _this.partials[part.name]) || isFunction(out) && out;
            out = fn ? apply(_this, fn, part.name, part.vars, data, part) : out && (part.isUnescaped ? out : escapeHtml(out, _this));
            return out;
        };
    }
    function section(_this, fn, name, vars, unEscaped, isNot) {
        var type = name;
        name = getVar(vars.length && (name === "if" || name === "each" || name === "with" || name === "unless") ? vars.shift() : name);
        vars = splitVars(_this, vars, getVar(name.name), unEscaped, "");
        return function fastLoop(data, loopData) {
            return loop(_this, data, fn, name, vars, isNot, type, loopData);
        };
    }
    function loop(_this, data, fn, name, vars, isNot, type, loopData) {
        var _data = findData(data, name.name, isArray(loopData) ? loopData : name.keys, name.depth);
        var helper = !name.strict && (_this.helpers[name.name] || isFunction(_data) && _data);
        var helperOut = helper && apply(_this, helper, name.name, vars.vars, data, vars, fn[0], fn[1]);
        var _isArray = isArray(_data);
        var objData = type === "each" && !_isArray && typeof _data === "object" && _data;
        var out = "";
        _data = _data === undefined ? isArray(data.path[0]) && data.path[0] : _data;
        if (helper) {
            data.helpers[0] = createHelper(helperOut, name.name, undefined, vars.helpers);
            if (type === "if") {
                return helperOut ? fn[0](data) : fn[1] && fn[1](data);
            } else if (type === "unless") {
                return !helperOut ? fn[0](data) : fn[1] && fn[1](data);
            } else {
                _data = helperOut;
                _isArray = isArray(_data);
            }
        }
        if (type === "unless") {
            _data = !_data;
        } else if (objData) {
            _data = getKeys(_data, []);
        }
        if (_isArray || objData) {
            if (isNot) {
                return !_data.length ? fn[0](_data) : "";
            }
            data.path.unshift({});
            data.helpers.unshift({});
            for (var n = 0, l = _data.length; n < l; n++) {
                data.path[0] = _isArray ? _data[n] : objData[_data[n]];
                data.helpers[0] = createHelper(data.path[0], _isArray ? n : _data[n], name, vars.helpers, l, n);
                out = out + fn[0](data, _data[n]);
            }
            data.path.shift();
            data.helpers.shift();
            return out;
        }
        if (isNot && !_data || !isNot && _data) {
            return helper && typeof _data === "string" ? _data : fn[0](type === "unless" || type === "if" ? data : getSource(data, undefined, _data, createHelper(_data, name.name, undefined, vars.helpers)));
        }
        return fn[1] && fn[1](data);
    }
    function sizzleTemplate(_this, text, sections) {
        var _text = "";
        var tags = _this.options.tags;
        while (_text !== text && (_text = text)) {
            text = text.replace(_this.sectionRegExp, function(all, start, type, name, vars, end, rest) {
                if (type === "#*") {
                    var partialName = vars.replace(/(?:^['"]|['"]$)/g, "");
                    _this.partials[partialName] = _this.partials[partialName] || sizzleTemplate(_this, rest, sections);
                    return "";
                }
                rest = rest.split(_this.elseSplitter);
                sections.push(section(_this, [ inline(_this, rest[0], sections, name), rest[1] && inline(_this, rest[1], sections, name) ], name, vars && vars.replace(/[(|)]/g, "").split(/\s+/) || [], start === "{{{", type === "^"));
                return tags[0] + "-section- " + (sections.length - 1) + " " + (vars || name) + tags[1];
            });
        }
        text = inline(_this, text, sections);
        return function executor(data, extra) {
            return text(getSource(data, extra && (isArray(extra) && extra || [ extra ])));
        };
    }
});

(function defineBlick(root, factory) {
    if (typeof exports === "object") module.exports = factory(root, require("schnauzer")); else if (typeof define === "function" && define.amd) define("blick", [ "schnauzer" ], function(Schnauzer) {
        return factory(root, Schnauzer);
    }); else root.Blick = factory(root, root.Schnauzer);
})(this, function BlickFactory(root, Schnauzer, undefined) {
    "use strict";
    function parseHtml(tags, search) {
        for (var tag in tags) tags[tag] = document.createElement(tags[tag]);
        parseHtml = function(html) {
            var tag = ((html || "").match(search) || [])[1];
            var helper = tags[tag] || tags["_default"];
            helper.innerHTML = html || "";
            return helper;
        };
    }
    parseHtml({
        option: "select",
        legend: "fieldset",
        area: "map",
        param: "object",
        thead: "table",
        tr: "tbody",
        col: "colgroup",
        td: "tr",
        _default: "div"
    }, /<\s*(\w*)\s*[\s\S]*?>/);
    var Blick = function(template, options) {
        this.version = "0.0.1";
        this.options = {
            registerProperty: dummy,
            unregisterProperty: dummy,
            attributes: {
                value: updateValue,
                disabled: disableAttribute,
                checked: disableAttribute,
                autocomplete: disableAttribute,
                contenteditable: disableAttribute,
                readonly: disableAttribute,
                required: disableAttribute,
                selected: disableAttribute
            }
        };
        init(this, options || {}, template);
    }, init = function(_this, options, template) {
        for (var option in options) {
            if (option === "attributes") {
                for (var attr in options[option]) {
                    _this.options[option][attr] = options[option][attr];
                }
            } else {
                _this.options[option] = options[option];
            }
        }
        var registerProperty = _this.options.registerProperty;
        _this.options.registerProperty = function(part, foundNode) {
            registerProperty(part.name, part.replacer, part.data.path[0], part.isActive, part.parent, foundNode);
        };
        options.render = renderHook;
        _this.search = /{{#\d+}}[\S\s]*{{\/\d+}}/;
        _this.attrSplitter = /([^}{]*)({{#(\d+)}}[\s\S]*?{{\/\d+}})/g;
        _this.schnauzer = new Schnauzer(template, options);
    }, dump = [], dummy = function() {}, disableAttribute = function(element, name, value) {
        if (value === true || value === "true" || !value && value !== false) {
            element.setAttribute(name, "");
            element[name] = true;
        } else {
            element.removeAttribute(name);
            element[name] = false;
            if (value === "focus") {
                element.focus();
            }
        }
    }, updateValue = function(element, name, value) {
        element.setAttribute("value", value);
        element.value = value;
    };
    Blick.prototype = {
        render: function(data, extra) {
            return this.schnauzer.render(data, extra);
        },
        renderHTML: function(data, extra) {
            var fragment = document.createDocumentFragment();
            var html = this.schnauzer.render(data, extra);
            return resolveReferences(this, dump, html, null, fragment);
        }
    };
    return Blick;
    function findNode(container, pattern) {
        return document.evaluate('//text()[contains(., "' + pattern + '")]', container, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || document.evaluate('//@*[contains(., "' + pattern + '")]', container, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    function renderHook(data) {
        var index = dump.length;
        if (!data.fn || !data.name || !data.isActive || data.partial || data.type === "decorator" || data.type === "helper" || data.name.charAt(0) === "@") {
            return data.text + data.value;
        }
        data.isSection = checkSection(data);
        dump[index] = data;
        return data.text + "{{#" + index + "}}" + data.value + "{{/" + index + "}}";
    }
    function textNodeSplitter(node, first, last) {
        node.splitText(node.textContent.lastIndexOf(last) + last.length).textContent;
        return node.splitText(node.textContent.indexOf(first));
    }
    function checkSection(part, node) {
        return part.section && !part.type && (part.value.indexOf("{{#") !== -1 || node && node.textContent.indexOf("{{#") !== -1);
    }
    function clearMemory(array) {
        var a = true;
        var keep = {
            replacer: a,
            lastNode: a,
            fn: a,
            children: a,
            unregister: a,
            data: a
        };
        for (var n = array.length; n--; ) {
            for (var key in array[n]) if (!keep[key]) delete array[n][key];
            array[n] = null;
        }
        return null;
    }
    function render(container, helperContainer, fragment) {
        while (helperContainer.childNodes.length) {
            fragment.appendChild(helperContainer.childNodes[0]);
        }
        if (container) {
            container.parentNode.insertBefore(fragment, container.nextSibling);
        } else {
            return fragment;
        }
    }
    function checkSectionChild(node, child, sections, options) {
        if (node && sections.length !== 0) {
            for (var n = sections.length; n--; ) {
                sections[n].children.push({
                    unregister: function(item) {
                        return function unregister() {
                            options.unregisterProperty(item.name, item);
                        };
                    }(child)
                });
                if (node.textContent.indexOf(sections[n].search) !== -1) {
                    node.textContent = node.textContent.replace(sections[n].search, "");
                    sections.pop();
                }
            }
        }
        return sections;
    }
    function getDifference(a, b) {
        var i = 0, j = 0, result = "";
        while (j < b.length) {
            if (a[i] !== b[j] || i === a.length) {
                result += b[j];
            } else {
                i++;
            }
            j++;
        }
        return result;
    }
    function resolveReferences(_this, memory, html, container, fragment) {
        var search = _this.search;
        var helperContainer = parseHtml(html);
        var first = "";
        var last = "";
        var part = {};
        var foundNode = {};
        var lastNode = {};
        var options = _this.options;
        var registerProperty = options.registerProperty;
        var original = "";
        var newMemory = [];
        var openSections = [];
        var out;
        var valueSplitter = {};
        for (var n = memory.length; n--; ) {
            first = "{{#" + n + "}}";
            last = "{{/" + n + "}}";
            part = memory[n];
            foundNode = findNode(helperContainer, first);
            if (!foundNode) {
                window.console && console.warn("There might be an error in the SCHNAUZER template");
            } else if (foundNode.ownerElement) {
                if (!foundNode.valueSplitter) {
                    valueSplitter = foundNode.valueSplitter = [];
                    valueSplitter.valueTracker = {};
                    valueSplitter.push(foundNode.textContent.replace(_this.attrSplitter, function(_, $1, $2, $3) {
                        valueSplitter.push($1);
                        valueSplitter.push($2);
                        valueSplitter.valueTracker[$3] = valueSplitter.length - 1;
                        return "";
                    }));
                }
                part.replacer = function(elm, ownerElement, name, search, orig, item, _n) {
                    return function updateAttribute(keys, _value) {
                        var value = _value || item.fn(item.data, keys);
                        if (value === undefined) value = "";
                        if (options.attributes[name]) {
                            elm = null;
                            options.attributes[name](ownerElement, name, value);
                        } else if (value !== undefined) {
                            var oldValue = elm.valueSplitter.join("").trim();
                            var diff = [];
                            var newValue = "";
                            if (oldValue !== elm.textContent) {
                                newValue = elm.textContent.split(oldValue)[1] || "";
                                diff = getDifference(elm.textContent, oldValue);
                                diff = diff && diff.split(/\s+/);
                            }
                            elm.valueSplitter[elm.valueSplitter.valueTracker[_n]] = value;
                            var outValue = elm.valueSplitter.join("").trim() + newValue;
                            for (var m = diff.length; m--; ) {
                                if (diff[m]) outValue = outValue.replace(diff[m], "");
                            }
                            elm.textContent = outValue;
                        }
                    };
                }(foundNode, foundNode.ownerElement, foundNode.name, search, foundNode.textContent, part, n);
                registerProperty(part, foundNode);
                openSections = checkSectionChild(foundNode.ownerElement.previousSibling, part, openSections, options);
                part.replacer(null, part.value);
            } else if (!checkSection(part, foundNode)) {
                foundNode = textNodeSplitter(foundNode, first, last);
                part.replacer = function(elm, item) {
                    return function updateTextNode(keys) {
                        elm.textContent = item.fn(item.data, keys);
                    };
                }(foundNode, part);
                foundNode.textContent = part.value;
                registerProperty(part, foundNode);
                openSections = checkSectionChild(foundNode, part, openSections, options);
            } else {
                openSections = checkSectionChild(foundNode, part, openSections, options);
                openSections.push({
                    search: first,
                    children: part.children = []
                });
                lastNode = findNode(foundNode.parentNode, last);
                part.lastNode = lastNode = lastNode.splitText(lastNode.textContent.lastIndexOf(last));
                lastNode.textContent = lastNode.textContent.replace(last, "");
                foundNode = foundNode.splitText(foundNode.textContent.indexOf(first));
                foundNode.textContent = foundNode.textContent.replace(first, "");
                part.replacer = function(elm, item) {
                    return function updateSection(keys) {
                        while (item.lastNode.previousSibling && item.lastNode.previousSibling !== elm) {
                            elm.parentNode.removeChild(item.lastNode.previousSibling);
                        }
                        if (item.children) for (var n = item.children.length; n--; ) {
                            item.children[n].unregister();
                        }
                        elm.textContent = "";
                        newMemory = resolveReferences(_this, dump, item.fn(item.data, keys), elm, fragment);
                        item.children = clearMemory(newMemory);
                        var collector = [];
                        var node = item.lastNode;
                        while (node !== elm && (node = node.previousSibling)) {
                            if (node.nodeType === 1) {
                                collector.push(node);
                            }
                        }
                        return collector;
                    };
                }(foundNode, part);
                registerProperty(part, foundNode);
            }
        }
        out = render(container, helperContainer, fragment);
        if (!container) memory = clearMemory(memory);
        dump = [];
        return container ? memory : out;
    }
});

(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory(root);
    } else if (typeof define === "function" && define.amd) {
        define("VOM", [], function() {
            return factory(root);
        });
    } else {
        root.VOM = factory(root);
    }
})(this, function(window, undefined) {
    "use strict";
    var VOM = function(model, options) {
        this.options = {
            parentCheck: false,
            idProperty: "id",
            subscribe: function() {},
            enrichModelCallback: function() {},
            preRecursionCallback: function() {},
            moveCallback: function() {},
            listeners: [],
            forceEnhance: false,
            childNodes: "childNodes",
            throwErrors: false
        };
        this.model = model || [];
        init(this, options || {});
    }, init = function(_this, options) {
        var rootItem = {}, _options = _this.options;
        NODES.push({});
        reinforceProperty(_this, "id", NODES.length - 1);
        for (var option in options) {
            _options[option] = options[option];
        }
        _options.listeners = [];
        for (var n = (options.listeners || []).length; n--; ) {
            if (!options.listeners[n]) continue;
            _options.listeners[n] = options.listeners[n].split(pathSplit);
        }
        if (_this.model.constructor !== Array) {
            _this.model = [ _this.model ];
            _this.standalone = true;
        }
        rootItem[_options.childNodes] = _this.model;
        if (!_this.standalone) {
            reinforceProperty(_this.model, "root", rootItem);
        }
        enrichModel(_this, _this.model);
    }, pathSplit = /\.|\//, NODES = [], idCounter = 0;
    VOM.prototype = {
        getElementById: function(id) {
            return NODES[this.id][id];
        },
        getElementsByProperty: function(property, value) {
            var result = [], hasValue = undefined !== value, hasProperty = undefined !== property, keys = [], propValue = null, node = NODES[this.id];
            for (var id in node) {
                propValue = undefined !== node[id][property] ? node[id][property] : crawlObject(node[id], keys[0] ? keys : keys = hasProperty && property.split(pathSplit));
                if (hasValue && propValue === value || !hasValue && undefined !== propValue || !hasValue && !hasProperty) {
                    result.push(node[id]);
                }
            }
            return result;
        },
        appendChild: function(item, parent) {
            parent = parent || this.model.root;
            return moveItem(this, item, parent, getChildNodes(parent, this.options.childNodes).length, "appendChild", parent);
        },
        prependChild: function(item, parent) {
            parent = parent || this.model.root;
            return moveItem(this, item, parent, 0, "prependChild", parent);
        },
        insertBefore: function(item, sibling) {
            return moveItem(this, item, sibling.parentNode, sibling.index, "insertBefore", sibling);
        },
        insertAfter: function(item, sibling) {
            return moveItem(this, item, sibling.parentNode, sibling.index + 1, "insertAfter", sibling);
        },
        replaceChild: function(newItem, item) {
            var index = item.index, parentNode = item.parentNode;
            newItem !== item && removeChild(this, item);
            moveItem(this, newItem, parentNode, index, "replaceChild", item);
            return item;
        },
        removeChild: function(item) {
            removeChild(this, item);
            this.options.subscribe.call(this, "removeChild", item);
            return item;
        },
        sortChildren: function(callback, model, children) {
            model = (model || this.model).sort(callback);
            for (var n = 0, l = model.length; n < l; n++) {
                this.options.subscribe.call(this, "sortChildren", model[n]);
                if (children && model[n][this.options.childNodes]) {
                    this.sort(callback, model[n][this.options.childNodes], children);
                }
            }
        },
        addProperty: function(property, item, readonly) {
            return addProperty(this, property.split(pathSplit)[0], {
                current: item,
                root: item
            }, property, readonly);
        },
        reinforceProperty: reinforceProperty,
        getProperty: function(property, item) {
            return crawlObject(item, property.split(pathSplit));
        },
        getCleanModel: function(item) {
            return JSON.parse(JSON.stringify(item || this.model));
        },
        destroy: function() {
            return destroy(this, this.model);
        }
    };
    VOM.getElementById = function(id) {
        var split = id.split(":");
        return NODES[split[0]] && NODES[split[0]][split[1]];
    };
    return VOM;
    function crawlObject(data, keys) {
        for (var n = 0, m = keys.length; n < m; n++) {
            if (keys[n] === "*") return data;
            data = data && data[keys[n]];
        }
        return data;
    }
    function destroy(_this, items) {
        for (var n = items.length; n--; ) {
            if (items[n][_this.options.childNodes]) {
                destroy(_this, items[n][_this.options.childNodes]);
            }
            delete NODES[_this.id][items[n][_this.options.idProperty]];
            items.pop();
        }
        return items;
    }
    function indexOf(_this, item) {
        return item.__index !== undefined ? item.__index : (item.parentNode ? getChildNodes(item.parentNode, _this.options.childNodes) : _this.model).indexOf(item);
    }
    function getChildNodes(item, childNodes) {
        item[childNodes] = item[childNodes] || [];
        return item[childNodes];
    }
    function moveItem(_this, item, parent, index, type, sibling) {
        var options = _this.options;
        var oldParent = item.parentNode;
        if (!item.parentNode) {
            item.__index = index;
            enrichModel(_this, [ item ], parent, type, sibling);
        } else if (options.parentCheck) {
            parentCheck(item, parent, options);
        }
        _this.type = type;
        _this.sibling = sibling;
        if (item.parentNode === parent && index > item.index && item.index !== -1) {
            index--;
        }
        item = item.index !== -1 && item.parentNode && removeChild(_this, item, true) || item;
        getChildNodes(parent, options.childNodes).splice(index || 0, 0, item);
        item.parentNode = parent;
        options.moveCallback.call(_this, item, type, sibling, oldParent);
        return item;
    }
    function removeChild(_this, item, preserve) {
        !preserve && destroy(_this, [ item ]);
        return getChildNodes(item.parentNode, _this.options.childNodes).splice(item.index, 1)[0] || item;
    }
    function parentCheck(item, parent, options) {
        var check = parent;
        if (item === parent) {
            error("ERROR: can't move element inside itself", options);
        }
        while (check = check.parentNode) {
            if (check === item) {
                error("ERROR: can't move parent inside it's own child", options);
            }
        }
    }
    function enrichModel(_this, model, parent, type, sibling) {
        var options = _this.options, isNew = false, hasOwnId = true, idProperty = options.idProperty, item = {};
        for (var n = 0, l = model.length; n < l; n++) {
            item = model[n];
            if (!item[idProperty] && !_this.standalone) {
                item[idProperty] = idCounter++;
                hasOwnId = false;
            }
            NODES[_this.id][item[idProperty]] = item;
            isNew = !item.parentNode;
            if (!_this.standalone) {
                item.parentNode = parent || _this.model.root;
                item.index = item.index || 0;
            }
            if (isNew) {
                if (!_this.standalone) {
                    reinforceProperty(item, idProperty, item[idProperty], hasOwnId);
                    addProperty(_this, "index", {
                        current: item
                    }, null, true);
                    addProperty(_this, "parentNode", {
                        current: item
                    }, null, true);
                }
                enhanceModel(_this, item, _this.options.listeners);
            }
            options.preRecursionCallback.call(_this, item, type, sibling);
            item[options.childNodes] && enrichModel(_this, item[options.childNodes], item);
            options.enrichModelCallback.call(_this, item, type, sibling);
            delete item.__index;
        }
        return model;
    }
    function addProperty(_this, property, item, path, readonly) {
        var cache = {};
        if (!_this.options.forceEnhance && !item.current.hasOwnProperty(property)) return;
        cache[property] = item.current[property];
        return defineProperty(_this, property, item, cache, !readonly, path);
    }
    function enhanceModel(_this, model, listeners, recPath, recModel) {
        var listener = [], wildcardPos = 0, restPos = 0, path = "", deepModel = {}, deepListener = [];
        for (var n = listeners.length; n--; ) {
            listener = listeners[n];
            wildcardPos = listener.indexOf("*");
            path = (recPath || "") + listener.join(".");
            deepModel = recModel || crawlObject(model, listener);
            if (wildcardPos !== -1) {
                restPos = wildcardPos + 1;
                for (var item in deepModel) {
                    if (restPos === listener.length) {
                        addProperty(_this, item, {
                            current: deepModel,
                            root: model
                        }, path.replace("*", item));
                    } else {
                        deepListener = listener.slice(restPos);
                        enhanceModel(_this, model, [ listener.slice(restPos) ], path.split("*")[0] + item + ".", crawlObject(deepModel[item], deepListener.slice(0, deepListener.length - 1)));
                    }
                }
            } else {
                deepModel = listener.length !== 1 ? crawlObject(recModel || model, listener.slice(0, -1)) : model;
                addProperty(_this, listener[listener.length - 1], {
                    current: recModel ? recModel : deepModel,
                    root: model
                }, path);
            }
        }
        return model;
    }
    function reinforceProperty(model, item, value, writeable, enumable) {
        delete model[item];
        return Object.defineProperty(model, item, {
            enumerable: !!enumable,
            configurable: false,
            writable: writeable === undefined ? true : !!writeable,
            value: value
        });
    }
    function defineProperty(_this, prop, obj, cache, enumable, path) {
        return Object.defineProperty(obj.current, prop, {
            get: function() {
                return prop === "index" ? indexOf(_this, obj.current) : cache[prop];
            },
            set: function(value) {
                validate(path || prop, obj, cache[prop], cache[prop] = value, cache, _this);
            },
            enumerable: enumable
        });
    }
    function validate(prop, obj, oldValue, value, cache, _this) {
        if (prop === _this.options.idProperty || prop === "index" || _this.options.subscribe.call(_this, _this.type || prop, obj.root || obj.current, value, oldValue, _this.sibling)) {
            cache[prop] = oldValue;
            error('ERROR: Cannot set property "' + prop + '" to "' + value + '"', _this.options);
        }
        delete _this.type;
        delete _this.sibling;
    }
    function error(txt, options) {
        if (!options.throwErrors && window !== undefined && window.console) {
            return console.warn ? console.warn(txt) : console.log(txt);
        }
        throw txt;
    }
});

define("api", [ "VOM", "blick", "toolbox" ], function(VOM, Blick, Toolbox) {
    return function(Circular) {
        var $ = Toolbox.$;
        var $$ = Toolbox.$$;
        var pubsub = {};
        var modulesMap = {};
        var DOC = null;
        Circular.prototype.constructor = Circular;
        Circular.prototype.model = function(model, options) {
            return new VOM(model, options);
        };
        Circular.prototype.getBaseModel = function(name) {};
        Circular.prototype.destroy = function(name) {};
        Circular.prototype.getInstances = function() {
            return instances[this.id];
        };
        Circular.prototype.subscribe = function(inst, comp, attr, callback, trigger) {
            inst = inst ? inst.name || inst.components && inst.components[comp] || inst : this.name;
            pubsub[inst] = pubsub[inst] || {};
            comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
            comp[attr] = comp[attr] || [];
            if (callback) {
                comp[attr].push(callback.callback || callback);
                if (callback.regexp && !comp[attr].regexp) {
                    comp[attr].regexp = callback.regexp;
                    comp[attr].names = callback.names;
                }
            }
            if (!attr || !comp[attr]) {
                delete pubsub[inst];
                return;
            }
            if (trigger && comp[attr].value !== undefined) {
                (callback.callback || callback).call(this, comp[attr].value);
            }
            return callback.callback || callback;
        };
        Circular.prototype.publish = function(inst, comp, attr, data) {
            inst = typeof inst === "string" ? inst : this.name;
            pubsub[inst] = pubsub[inst] || {};
            if (pubsub[inst]) {
                comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
                comp[attr] = comp[attr] || [];
                comp[attr].value = data;
                comp[attr][0] && publish(this, comp[attr], data);
            }
        };
        Circular.prototype.unsubscribe = function(inst, comp, attr, callback) {
            var funcNo = -1, funcs = {};
            inst = typeof inst === "string" ? inst : inst.name || this.name;
            if (pubsub[inst] && pubsub[inst][comp] && pubsub[inst][comp][attr]) {
                funcs = pubsub[inst][comp][attr];
                funcNo = funcs.indexOf(callback.callback || callback);
                if (funcNo !== -1) {
                    funcs.splice(funcNo, 1);
                }
            }
            return callback.callback || callback;
        };
        function publish(_this, pubsubs, data) {
            for (var n = 0, m = pubsubs.length; n < m; n++) {
                if (pubsubs[n]) pubsubs[n].call(_this, data);
            }
        }
        Circular.prototype.addRoute = function(data, trigger, hash) {
            var path = typeof data.path === "object" ? {
                regexp: data.path
            } : routeToRegExp(data.path), _hash = hash || this.options.hash, parts = extractRouteParameters(path, getPath(_hash)), routers = pubsub[this.name] && pubsub[this.name].__router;
            this.subscribe(null, "__router", data.path, {
                callback: data.callback,
                names: path.names,
                regexp: path.regexp || path
            }, trigger);
            if (trigger && parts) {
                data.callback.call(this, parts);
            }
            !routers && installRouter(pubsub[this.name].__router, this, _hash);
            return data;
        };
        Circular.prototype.removedRoute = function(data) {
            return this.unsubscribe(null, "__router", data.path, data.callback);
        };
        Circular.prototype.toggleRoute = function(data, isOn) {
            var router = pubsub[this.name].__router, callbacks = router[data.path].paused || router[data.path];
            router[data.path] = isOn ? callbacks : [];
            router[data.path].paused = !isOn ? callbacks : null;
        };
        function installRouter(routes, _this, hash) {
            var event = window.onpopstate !== undefined ? "popstate" : "hashchange";
            Toolbox.addEvent(window, event, function(e) {
                var parts = {};
                for (var route in routes) {
                    parts = extractRouteParameters(routes[route], getPath(hash));
                    parts && publish(_this, routes[route], parts);
                }
            }, _this.id);
        }
        function getPath(hash) {
            return decodeURI(hash ? location.hash.substr(hash.length) : location.pathname + location.search);
        }
        function routeToRegExp(route) {
            var names = [];
            route = route.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, "\\$&").replace(/\((.*?)\)/g, "(?:$1)?").replace(/(\(\?)?:\w+/g, function(match, optional) {
                names.push(match.substr(1));
                return optional ? match : "([^/?]+)";
            }).replace(/\*/g, "([^?]*?)");
            return {
                regexp: new RegExp("^" + route + "(?:\\?([\\s\\S]*))?$"),
                names: names
            };
        }
        function extractSearchString(query) {
            query = query ? query.split("&") : [];
            for (var n = 0, m = query.length, out = {}, parts = []; n < m; n++) {
                parts = query[n].split("=");
                out[parts[0]] = parts[1];
            }
            return out;
        }
        function extractRouteParameters(route, fragment) {
            var params = route.regexp && route.regexp.exec(fragment), names = {};
            if (!params) return null;
            params = params.slice(1);
            for (var n = 0, m = params.length; n < m; n++) {
                params[n] = params[n] ? n === m - 1 ? params[n] : decodeURIComponent(params[n]) : null;
                route.names[n] && (names[route.names[n]] = params[n]);
            }
            params.parameters = names;
            params.queries = extractSearchString(params[m - 1]);
            params.path = fragment.replace(/^\//, "").split("/");
            return params;
        }
        Circular.prototype.template = function(template, options) {
            options = options || {};
            options.helpers = options.helpers || this.options.helpers;
            var engine = new Blick(template, options);
            if (options.share) {
                for (var partial in engine.schnauzer.partials) {
                    if (!this.options.partials[partial] && partial !== "self") {
                        this.options.partials[partial] = engine.schnauzer.partials[partial];
                    }
                }
            }
            return engine;
        };
        Circular.prototype.loadResource = function(fileName, cache) {
            var _this = this, devFilter = function(elm) {
                return !elm.hasAttribute("cr-dev");
            };
            return Toolbox.ajax(fileName, {
                cache: cache
            }).then(function(data) {
                DOC = DOC || document.implementation.createHTMLDocument("");
                DOC.documentElement.innerHTML = data;
                return {
                    scripts: [].slice.call(DOC.scripts).filter(function(elm) {
                        return elm.type === "text/javascript" && devFilter(elm.parentNode.removeChild(elm));
                    }),
                    styleSheets: [].slice.call($$("link", DOC) || []).filter(devFilter).concat([].slice.call($$("style", DOC) || []).filter(devFilter)),
                    body: DOC.body,
                    head: DOC.head,
                    path: fileName.split("/").slice(0, -1).join("/")
                };
            }).catch();
        };
        Circular.prototype.insertResources = function(container, data) {
            var body = $('[cr-dev="container"]', data.body) || data.body;
            Toolbox.requireResources(data, "styles", container);
            while (body.childNodes[0]) container.appendChild(body.childNodes[0]);
            return Toolbox.requireResources(data, "scripts", container);
        };
        Circular.prototype.insertModule = function(fileName, container) {
            var _this = this;
            return this.loadResource(fileName, true).then(function(data) {
                return _this.insertResources(container, data).then(function() {
                    return {
                        path: data.path,
                        container: container
                    };
                });
            });
        };
        function moveChildrenToCache(data) {
            var childNodes = data.container.childNodes;
            while (childNodes[0]) {
                (data.modulesMap || modulesMap)[data.previousName].cache.appendChild(childNodes[0]);
            }
        }
        function transition(init, data, modules, modulePath) {
            var promise = init && init.then ? init : data.data, container = data.container, previousName = data.previousName, previousModule = modules[previousName], name = data.name, wrap = modules[name].wrap, remove = function() {
                if (!previousName || previousName === name) return;
                previousModule.cache.appendChild(previousModule.wrap);
            }, append = function() {
                if (modules[name].dontWrap) {
                    modules[name].wrap = wrap = modules[name].wrap.children[0];
                    delete modules[name].dontWrap;
                }
                container && container.appendChild(wrap);
                modulePath && data.init !== false && init(data.data, modulePath);
            };
            data.transition === true ? (remove(), append()) : data.transition({
                container: container,
                remove: remove,
                append: append,
                promise: new Toolbox.Promise(function(resolve) {
                    promise ? promise.then(function(_data) {
                        resolve();
                        return _data;
                    }) : resolve();
                }),
                component: wrap,
                previousComponent: (previousModule || {}).wrap
            });
        }
        Circular.prototype.renderModule = function(data) {
            var temp = null, isInsideDoc = data.container, modules = data.modulesMap || modulesMap, name = data.name, module = name && modules[name], init = module && module.init, hasTransition = data.transition, Promise = Toolbox.Promise;
            if (modules[data.previousName] && (!hasTransition || !name)) {
                moveChildrenToCache(data);
            }
            if (name && module) {
                init = init && data.init !== false && init(data.data, module.path);
                hasTransition ? transition(init, data, modules) : data.container.appendChild(module.cache);
                return new Promise(function(resolve) {
                    resolve(data.returnData ? data.data : init);
                });
            }
            modules[name] = module = {
                cache: document.createDocumentFragment(),
                dontWrap: data.dontWrap
            };
            if (!isInsideDoc) {
                temp = document.createElement("div");
                temp.style.display = "none";
                document.body.appendChild(temp);
            }
            if (hasTransition) {
                module.wrap = document.createElement("div");
                module.wrap.setAttribute("cr-wrap", name);
                if (temp) {
                    temp.appendChild(module.wrap);
                } else if (!data.data || (data.preInit || []).indexOf(data.name) !== -1 || (data.preInit || [])[0] === "*") {
                    data.container.appendChild(module.wrap);
                }
            }
            return name ? this.insertModule(data.path, module.wrap || data.container || temp).then(function(moduleData) {
                return new Promise(function(resolve) {
                    var moduleName = data.require === true ? name : data.require === false ? "" : data.require;
                    module.path = moduleData.path;
                    if (moduleName) {
                        require([ moduleName ], function(init) {
                            module.init = init;
                            if (!isInsideDoc && !hasTransition) {
                                data.init !== false && init(data.data, moduleData.path);
                                data.container = temp;
                                moveChildrenToCache(data);
                                temp.parentElement.removeChild(temp);
                            } else if (hasTransition) {
                                transition(init, data, modules, moduleData.path);
                            } else {
                                data.init !== false && init(data.data, moduleData.path);
                            }
                            if (data.data && data.data.then) {
                                data.data.then(function() {
                                    resolve(data.returnData ? data.data : init);
                                });
                            } else {
                                resolve(data.returnData ? data.data : init);
                            }
                        });
                    } else if (temp) {
                        moveChildrenToCache(data);
                        temp.parentElement.removeChild(temp);
                        resolve();
                    }
                });
            }).catch() : new Promise(function(a) {
                a();
            });
        };
        Circular.Toolbox = Toolbox;
        Circular.instance = new Circular();
    };
});

define("controller", [ "toolbox", "VOM" ], function(Toolbox, VOM) {
    "use strict";
    var keys = Toolbox.keys;
    function Controller(options) {
        this.options = {
            element: document.body
        };
        this.events = {};
        for (var option in options) {
            this.options[option] = options[option];
        }
    }
    Controller.prototype = {
        installEvent: function(instance, element, eventName, items) {
            var componentElement = this.options.element;
            if (this.events[eventName]) return;
            this.events[eventName] = Toolbox.addEvent(element, eventName, function(e) {
                eventDelegator(e, instance, items, componentElement, VOM.getElementById);
            }, /(?:focus|blur|mouseenter|mouseleave)/.test(eventName) ? true : false);
        },
        installEvents: function(instance, element, events, items) {
            var _this = this;
            keys(events).forEach(function(key) {
                _this.installEvent(instance, element, key, items);
            });
        },
        removeEvent: function(eventName) {
            if (this.events[eventName]) {
                this.events[eventName]();
                delete this.events[eventName];
            }
        },
        removeEvents: function(events) {
            events.forEach(this.removeEvent);
        },
        destroy: function() {
            this.removeEvents(keys(this.events));
            this.options.element = null;
        }
    };
    return Controller;
    function triggerEvent(instance, events, model, key, e, stopPropagation) {
        if (!instance[key]) return console.warn('No event handler "' + key + '" on instance:', instance);
        events[e.type][key].forEach(function(eventElement) {
            if (!stopPropagation._ && eventElement.contains(e.target)) {
                stopPropagation._ = instance[key](e, eventElement, model) === false;
                if (stopPropagation._) e.stopPropagation();
            }
        });
    }
    function eventDelegator(e, instance, rootItems, componentElement, getElementById) {
        var element = Toolbox.closest(e.target, "[cr-event]");
        var id = element && element.getAttribute("cr-id") || Toolbox.closest(e.target, "[cr-id]").getAttribute("cr-id");
        var model = getElementById(id);
        var events = model && model.events && keys(model.events[e.type]);
        var rootEvents = rootItems && keys(rootItems.events[e.type]) || [];
        var modelHasEvents = events && events.length;
        var modelEvents = !modelHasEvents ? rootItems && rootItems.events : model && model.events;
        var sP = {
            _: false
        };
        (modelHasEvents ? events : rootItems && rootEvents || []).forEach(function(key) {
            triggerEvent(instance, modelEvents, model || rootItems, key, e, sP);
        });
        element !== componentElement && modelHasEvents && rootEvents.forEach(function(key) {
            triggerEvent(instance, rootItems.events, rootItems, key, e, sP);
        });
    }
});

define("circular", [ "toolbox", "blick", "VOM", "api", "controller" ], function(Toolbox, Blick, VOM, addCircularAPI, Controller) {
    "use strict";
    var $ = Toolbox.$;
    var $$ = Toolbox.$$;
    var keys = Toolbox.keys;
    var id = 0;
    var components = {};
    var templateWrapper = document.createElement("div");
    function Circular(name, options) {
        this.options = {
            element: "element",
            container: "container",
            events: "events",
            views: "views",
            hash: "#",
            partials: {},
            helpers: {},
            decorators: {}
        };
        this.instances = {};
        initCircular(this, name, options || {});
    }
    function initCircular(_this, name, options) {
        var isName = typeof name === "string";
        if (!isName) {
            options = name || {};
        }
        for (var option in options) {
            _this.options[option] = options[option];
        }
        _this.version = "0.5.0";
        _this.id = "cr_" + id++;
        _this.name = isName ? name : _this.id;
        _this.instances[_this.id] = {};
    }
    Object.defineProperties(Circular.prototype, {
        initComponents: {
            value: function(selector, context) {
                var selectors = selector ? [ selector ] : keys(components);
                var innerComponents = getInnerComponents(selectors, [], context);
                innerComponents.forEach(function(element) {
                    components[element.getAttribute("cr-component") || element.tagName.toLowerCase()].init(element, context && innerComponents);
                });
            }
        },
        getInstance: {
            value: function(id) {
                return this.instances[this.id][id];
            }
        }
    });
    Object.defineProperties(Circular, {
        Component: {
            value: function(defData, Klass) {
                return components[defData.selector] || (components[defData.selector] = {
                    Klass: Klass,
                    selector: defData.selector,
                    templates: processTemplate(templateWrapper, defData),
                    styles: installStyles(defData.selector, defData),
                    name: defData.name || Klass.name,
                    init: function init(element, innerComponents) {
                        return initComponent(element, defData, Klass, innerComponents);
                    }
                });
            }
        }
    });
    addCircularAPI(Circular);
    return Circular;
    function initComponent(element, defData, Klass, innerComponents) {
        var selector = defData.selector;
        var component = components[selector];
        var items = {};
        var instance = {};
        var crInstance = defData.circular || Circular.instance;
        var initComponents = {};
        var controller = {};
        var models = [];
        var templates = component.templates;
        if (element.hasAttribute("cr-id")) return;
        [ "partials", "helpers", "decorators", "attributes" ].forEach(function(key) {
            if (!defData[key]) defData[key] = crInstance.options[key];
        });
        items = {
            "cr-id": (element.setAttribute("cr-id", "cr-" + ++id), id),
            elements: {
                element: element
            },
            events: {},
            parentNode: {},
            views: {}
        };
        instance = crInstance.instances[crInstance.id][element.getAttribute("cr-name") || items["cr-id"]] = new Klass(element, items.views);
        controller = new Controller({
            element: element
        });
        models = keys(templates).concat(keys(defData.$));
        models.filter(function(item, idx) {
            return models.indexOf(item) === idx;
        }).sort(function(a) {
            return a === "this" ? -1 : 0;
        }).forEach(function(key) {
            if (!key) return;
            applyModel({
                instance: instance,
                items: items,
                defData: defData,
                template: templates[key] && templates[key].template,
                childTemplate: templates[key] && templates[key].child,
                templateContainer: templates[key] ? getPlaceHolder(element, templates[key].container + "") : element,
                modelName: key,
                listeners: defData.$ && defData.$[key],
                crInstance: crInstance,
                controller: controller
            });
        });
        element.removeAttribute("cr-cloak");
        initComponents = function(context) {
            crInstance.initComponents(null, context || element);
        };
        instance.onInit && instance.onInit(element, items, initComponents, crInstance);
        defData.autoInit !== false && initComponents();
        return instance;
    }
    function getPlaceHolder(element, idx) {
        var placeholder = idx && element.querySelector('script[data-idx="' + idx + '"]');
        var parent = placeholder && placeholder.parentNode;
        if (placeholder) {
            parent.removeChild(placeholder);
        }
        return parent || element;
    }
    function destroyCollector(collector) {
        if (!collector) return;
        for (var item in collector) delete collector[item];
    }
    function resetComponent(data, vom) {
        destroyCollector(data.template && data.template.collector);
        destroyCollector(data.childTemplate && data.childTemplate.collector);
        data.templateContainer.innerHTML = "";
    }
    function applyModel(data) {
        var vom = getVOMInstance(data);
        if (data.modelName === "this" || data.instance[data.modelName].constructor !== Array) return;
        for (var key in VOM.prototype) {
            Object.defineProperty(vom.model, key, {
                value: vom[key].bind(vom)
            });
        }
        Object.defineProperty(data.instance, data.modelName, {
            get: function() {
                return vom.model;
            },
            set: function(newModel) {
                vom.destroy();
                resetComponent(data, vom);
                vom.__isNew = true;
                newModel.forEach(function(item) {
                    vom.appendChild(item);
                });
                delete vom.__isNew;
            }
        });
    }
    function getVOMInstance(data) {
        var instance = data.instance;
        var modelName = data.modelName;
        return data.crInstance.model(modelName === "this" ? instance : instance[modelName] || [], {
            idProperty: "cr-id",
            moveCallback: instance[modelName + "Move$"] || function() {},
            enrichModelCallback: instance[modelName + "Enrich$"] || function() {},
            listeners: data.listeners,
            preRecursionCallback: function(item, type, siblPar) {
                var element = setNewItem(this, {
                    item: item,
                    type: type,
                    siblPar: siblPar,
                    data: data
                });
                instance[modelName + "PreRecursion$"] && instance[modelName + "PreRecursion$"](item, element);
            },
            subscribe: function(property, item, value, oldValue, sibling) {
                changeItem(this, property, item, value, oldValue, sibling, data);
                instance[modelName + "$"] && (!this[property] || this.hasOwnProperty(property)) && instance[modelName + "$"](property, item, value, oldValue);
            }
        });
    }
    function setNewItem(vomInstance, param) {
        var item = param.item;
        var data = param.data;
        var rootElement = data.items.elements.element;
        var instContainer = data.templateContainer;
        var define = vomInstance.reinforceProperty;
        var isChild = !item.childNodes && !!data.childTemplate;
        var template = isChild ? data.childTemplate : data.template;
        var fragment = template && template.renderHTML(item, data.defData.extraModel);
        var parentElements = item.parentNode && item.parentNode.elements;
        var tmpParent = parentElements && parentElements.container || instContainer;
        var parent = isChild ? tmpParent.lastElementChild : tmpParent;
        var sibling = param.siblPar && param.siblPar.elements && param.siblPar.elements.element;
        var element = !fragment ? instContainer : render(fragment.children[0], param.type, parent, sibling);
        var container = isChild ? parent : element.hasAttribute("cr-mount") ? element : $("[cr-mount]", element);
        element.setAttribute("cr-id", vomInstance.id + ":" + (item["cr-id"] || 0));
        if (instContainer !== rootElement) {
            define(item, "elements", {
                element: element,
                container: container
            });
            define(item, "views", getViewMap(element, function(elm) {}));
            define(item, "events", getEventMap(element, function(eventName) {
                data.controller.installEvent(data.instance, rootElement, eventName);
            }));
        } else {
            data.items.views = getViewMap(element, function(elm) {});
            data.items.events = getEventMap(rootElement, function(eventName) {
                data.controller.installEvent(data.instance, rootElement, eventName, data.items);
            });
        }
        return element;
    }
    function changeItem(vomInstance, property, item, value, oldValue, sibling, data) {
        var element = item.elements && item.elements.element;
        var parentElements = item.parentNode && item.parentNode.elements;
        var parentElement = parentElements ? parentElements.container || parentElements.element : data.items.elements.container;
        var id = item["cr-id"];
        var template = !item.childNodes && data.childTemplate || data.template;
        var collector = template ? template.collector : {};
        if (property === "removeChild") {
            render(element, property, element.parentElement);
            destroyCollector(collector[id]);
            delete collector[id];
        } else if (property === "sortChildren") {
            render(element, "appendChild", parentElement);
        } else if (vomInstance[property]) {
            if (item === sibling) {
                setNewItem(vomInstance, {
                    item: item,
                    type: property,
                    siblPar: sibling,
                    data: data
                });
            } else if (property !== "replaceChild" && !vomInstance.__isNew) {
                render(element, property, parentElement, sibling.elements && sibling.elements.element);
            }
        }
        blickItems(data, item, collector, id, property, value, oldValue);
    }
    function blickItems(data, item, collector, id, property, value, oldValue) {
        var blickItem = collector[id] && collector[id][property];
        if (!blickItem) return;
        for (var n = blickItem.length, elm; n--; ) {
            if (blickItem[n].forceUpdate || value !== oldValue) {
                elm = blickItem[n].fn(blickItem[n].parent);
                if (data.controller && elm) for (var m = elm.length; m--; ) {
                    getEventMap(elm[m], function(eventName, fnName) {
                        var elms = item.events[eventName];
                        if (!elms) {
                            elms = item.events[eventName] = {};
                            data.controller.installEvent(data.instance, data.instance.element, eventName);
                        }
                        if (!elms[fnName]) {
                            elms[fnName] = [ elm[m] ];
                        } else {
                            elms[fnName].filter(function(elm, idx) {
                                if (!data.items.elements.element.contains(elm)) elms[fnName].splice(idx, 1);
                            });
                            elms[fnName].push(elm[m]);
                        }
                    });
                }
            }
        }
    }
    function render(html, operator, parentNode, sibling) {
        if (operator === "prependChild") {
            operator = "insertBefore";
            sibling = parentNode.children[0];
        } else if (operator === "insertAfter") {
            if (sibling.nextElementSibling) {
                operator = "insertBefore";
                sibling = sibling.nextElementSibling;
            } else {
                operator = "";
            }
        }
        parentNode[operator || "appendChild"](html, sibling);
        return html;
    }
    function installStyles(selector, options) {
        if (!options.styles) return;
        var link = document.createElement("style");
        link.setAttribute("name", selector);
        link.innerHTML = "\n" + options.styles + "\n";
        document.head.appendChild(link);
        return link;
    }
    function getInnerComponents(selectors, result, context) {
        var join = selectors.join("|.//");
        var wishList = (join ? ".//" + join + "|" : "") + ".//*[@cr-component]";
        var elms = selectors.length ? document.evaluate(wishList, context || document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null) : [];
        for (var n = elms.snapshotLength; n--; ) result.push(elms.snapshotItem(n));
        return result;
    }
    function setBlickItem(collector, name, fn, data, active, parent) {
        var noGetter = parent && data[parent[0]] && !Object.getOwnPropertyDescriptor(data[parent[0]], "0").get;
        var _parent = parent ? parent.slice(0) : parent;
        var blickItem = collector[data["cr-id"]] = collector[data["cr-id"]] || {};
        var _name = "";
        parent && noGetter && _parent.push(name);
        _name = _parent && _parent.join(".") || name;
        blickItem[_name] = blickItem[_name] || [];
        blickItem[_name].push({
            fn: fn,
            forceUpdate: active === 2,
            parent: parent && (name !== "this" && name !== "." ? parent.concat(name.split(".")) : parent)
        });
    }
    function getTemplate(template, defData) {
        var blick = {};
        template.parentNode && template.parentNode.removeChild(template);
        template.removeAttribute("cr-for");
        template.removeAttribute("cr-child");
        blick = new Blick(template.outerHTML.replace(/(?:{{&gt;|cr-src=)/g, function($1) {
            return $1.charAt(0) === "{" ? "{{>" : "src=";
        }), {
            helpers: defData.helpers || {},
            decorators: defData.decorators,
            partials: defData.partials,
            attributes: defData.attributes,
            registerProperty: function(name, fn, data, active, parent) {
                setBlickItem(blick.collector, name, fn, data, active, parent);
            }
        });
        blick.collector = {};
        return blick;
    }
    function createPlaceHolder(elm, idx) {
        var placeHolder = document.createElement("script");
        placeHolder.setAttribute("type", "placeholder/tmpl");
        placeHolder.setAttribute("data-idx", idx);
        return elm.parentNode.replaceChild(placeHolder, elm);
    }
    function processTemplate(element, defData) {
        var _ = element.innerHTML = defData.template;
        var templates = element.querySelectorAll("[cr-for]");
        var result = {};
        templates.forEach(function(elm, idx) {
            var child = $("[cr-child]", elm);
            var modelName = elm.getAttribute("cr-for");
            result[modelName] = {
                container: idx,
                child: child ? getTemplate(child, defData) : null,
                template: getTemplate(createPlaceHolder(elm, idx), defData)
            };
        });
        result["this"] = {
            template: getTemplate(element.firstElementChild, defData)
        };
        return result;
    }
    function getEventMap(element, fn) {
        var events = {};
        var elements = [ element ].concat([].slice.call($$("[cr-event]", element)));
        for (var n = elements.length, attribute = "", chunks = []; n--; ) {
            attribute = elements[n].getAttribute("cr-event");
            chunks = attribute ? attribute.split(/\s*;+\s*/) : [];
            for (var m = chunks.length, item = [], type = "", func = ""; m--; ) {
                item = chunks[m].split(/\s*:+\s*/);
                type = item[0];
                func = item[1];
                events[type] = events[type] || {};
                events[type][func] = events[type][func] || [];
                events[type][func].push(elements[n]);
                fn && fn(type, func);
            }
        }
        return events;
    }
    function getViewMap(element, fn) {
        var start = element.hasAttribute("cr-view") ? [ element ] : [];
        var elements = start.concat([].slice.call($$("[cr-view]", element)));
        var views = {};
        for (var n = elements.length; n--; ) {
            views[elements[n].getAttribute("cr-view")] = elements[n];
            fn && fn(elements[n]);
        }
        return views;
    }
});