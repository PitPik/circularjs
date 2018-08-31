!function(root, undefined) {
    "use strict";
    var _config = root.require || {}, _rand = root.Math.random, _documentFragment = null, _timer = 0, _foo = {}, _link = document.createElement("a"), extend = function(oldObj, newObj) {
        if (typeof newObj !== "object" || !newObj) return newObj;
        oldObj = oldObj || {};
        for (var key in newObj) {
            oldObj[key] = newObj[key].constructor === Array ? newObj[key] : typeof newObj[key] === "object" ? extend(oldObj[key], newObj[key]) : newObj[key];
        }
        return oldObj;
    }, applyConfiguration = function(config) {
        var parts = [ "lookaheadMap", "paths", "options", "baseUrl" ];
        for (var n = parts.length; n--; ) {
            require[parts[n]] = extend(require[parts[n]], config[parts[n]]) || require[parts[n]] || "";
        }
    }, getListIndex = function(list, item) {
        for (var n = list.length; n--; ) {
            if (list[n] === item) {
                return n;
            }
        }
        return -1;
    }, getPathFromName = function(name, _path, _postFix) {
        _postFix = /(?:^\!|^http[s]*:|.*\.js$)/.test(name) ? "" : ".js";
        name = (require.paths[name] || name).replace(/^\!/, "");
        _path = normalizePath((require.baseUrl || ".") + "/" + name + _postFix).replace(/^.\//, "");
        return _path;
    }, normalizePath = function(path) {
        _link.href = path;
        return (path.indexOf(_link.host) !== -1 ? _link.origin : "") + _link.pathname + _link.search;
    }, applyScript = function(module, sync) {
        var script = root.document.createElement("script");
        script.type = "text/javascript";
        script.async = script.defer = !sync ? true : false;
        script.charset = "utf-8";
        script.onload = script.onreadystatechange = function(e) {
            if (e.type === "load" || (e.currentTarget || e.srcElement).readyState === "complete") {
                if (!module.factory) {
                    markAsDone(module);
                }
                script.onload = script.onreadystatechange = null;
            }
        };
        script.src = module.path;
        return script;
    }, appendScript = function(script) {
        _documentFragment = _documentFragment || root.document.createDocumentFragment();
        _documentFragment.appendChild(script);
        clearTimeout(_timer);
        _timer = setTimeout(function appendScripts() {
            document.head.appendChild(_documentFragment);
        }, 0);
    }, checkIfModuleIsDone = function(module) {
        for (var count = 0, n = module.resolvedDeps.length; n--; ) {
            module.resolvedDeps[n] !== undefined && count++;
        }
        module.deps.length === count && markAsDone(module);
    }, notifyCaller = function(dep) {
        var module = null;
        for (var index = 0, n = 0, m = dep.parentNames.length; n < m; n++) {
            module = modules[dep.parentNames[n]];
            index = getListIndex(module.deps, dep.name);
            module.resolvedDeps[index] = dep.done;
            !module.done && checkIfModuleIsDone(module);
        }
        dep.parentNames = [];
    }, markAsDone = function(module) {
        if (!module.done) {
            module.done = (module.factory || function() {}).apply(null, module.resolvedDeps);
        }
        notifyCaller(module);
        if (!require.options.debug) {
            delete module.factory;
            if (module.name.indexOf("_mod") === 0) {}
        }
    }, lookaheadForDeps = function(name) {
        var deps = require.lookaheadMap[name];
        if (deps && (require.paths[name] || "").indexOf(require.options.minifyPrefix) === -1) {
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
            if (typeof name !== "string") {
                _foo = require(name, deps, factory);
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
                parentNames = modules[deps[n]] && modules[deps[n]].parentNames;
                if (!modules[deps[n]]) {
                    modules[deps[n]] = {
                        name: deps[n],
                        isFile: deps[n].substr(0, 1) === "!",
                        path: getPathFromName(deps[n]),
                        resolvedDeps: [],
                        parentNames: [ name ]
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
        }, require = root.require = function require(deps, factory, sync) {
            return deps.constructor === Array ? define("_mod" + (_rand() + _rand()), deps, factory, sync) : define("_mod" + (_rand() + _rand()), [], deps, factory);
        }, modules = require.modules = {}, config = require.config = function(options) {
            applyConfiguration(_config = options);
        };
        require.getFile = function(resource, markAsDone) {
            return resource;
        };
        define.amd = {};
        config(_config);
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
    var resourceCache = null, _link = document.createElement("a"), Toolbox = {
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
            return (root || document.body).querySelector(selector);
        },
        $$: function(selector, root) {
            return (root || document.body).querySelectorAll(selector);
        },
        parentsIndexOf: function(elements, target) {
            for (var n = elements.length; n--; ) {
                if (elements[n].contains(target)) {
                    return n;
                }
            }
            return -1;
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
        addEvents: function(elements, type, func, cap, _this) {
            for (var n = elements.length; n--; ) {
                Toolbox.addEvent(elements[n], type, func, cap, _this);
            }
        },
        removeEvents: function(_this, elements, type) {
            for (var n = elements.length; n--; ) {
                Toolbox.removeEvent(_this, elements[n], type);
            }
        },
        addEvent: function(element, type, func, cap, _this) {
            Toolbox.addEvent.events = Toolbox.addEvent.events || [];
            Toolbox.addEvent.events.push({
                e: element,
                t: type,
                f: func,
                c: cap,
                i: _this || Toolbox
            });
            element.addEventListener(type, func, cap);
        },
        removeEvent: function(_this, element, type) {
            var item = {}, elmCondition = false, n = 0;
            for (n = (Toolbox.addEvent.events || []).length; n--; ) {
                item = Toolbox.addEvent.events[n];
                elmCondition = !element || item.e === element && (!type || type === item.t);
                if (item.i === (_this || Toolbox) && elmCondition) {
                    item.e.removeEventListener(item.t, item.f, item.c);
                    Toolbox.addEvent.events.splice(n, 1);
                }
            }
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
            var path = "";
            var text = "";
            var isStyles = type === "styles";
            var attribute = isStyles ? "href" : "src";
            var items = isStyles ? data.links.concat(data.styles) : data.scripts;
            resourceCache = resourceCache || Toolbox.captureResources();
            while (items.length) {
                item = items.shift();
                resourceName = item.getAttribute(attribute);
                path = Toolbox.normalizePath(data.path ? data.path + "/" + resourceName : "" + resourceName);
                if (resourceName && resourceCache[path]) {
                    continue;
                }
                if (!isStyles) {
                    text = item.text;
                    item = document.createElement("script");
                    item.setAttribute("type", "text/javascript");
                    item.async = true;
                    if (!resourceName) {
                        item.text = text;
                    }
                    promises.push(new Toolbox.Promise(function(resolve) {
                        if (!resourceName) {
                            container && container.appendChild(item);
                            resolve(item);
                        } else {
                            item.onload = function() {
                                resolve(this);
                            };
                        }
                    }));
                }
                if (resourceName) {
                    item[attribute] = path;
                    document.head.appendChild(item);
                    resourceCache[path] = item;
                } else if (container && isStyles) {
                    container.appendChild(item);
                }
            }
            if (promises.length === 0) {
                promises.push(new Toolbox.Promise(function(resolve) {
                    resolve(function() {});
                }));
            }
            return Toolbox.Promise.all(promises);
        },
        captureResources: function() {
            var cache = {};
            var resources = [].slice.call(Toolbox.$$("script", document)).concat([].slice.call(Toolbox.$$("link", document)));
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
        doResolve(fn, this);
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
                    doResolve(then.bind(newValue), self);
                    return;
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
            fn(function(value) {
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
        var promise = new Promise(function() {});
        handle(this, {
            onFulfilled: onFulfilled || null,
            onRejected: onRejected || null,
            promise: promise
        });
        return promise;
    };
    Promise.prototype.cancel = function(id) {
        var promise = Promise._cache[id];
        if (promise) {
            promise._deferreds = [];
            promise.then = promise["catch"] = function() {};
            promise._handled = true;
        }
        return Promise._cache[id] = this;
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
            return this.partials[name] = this.partials[name] || sizzleTemplate(this, text);
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
    function check(data, altData) {
        return data !== undefined ? data : altData;
    }
    function findData(data, key, keys, pathDepth) {
        if (!keys) {
            return;
        }
        var _data = data.path[pathDepth] || {};
        var helpers = data.helpers[pathDepth] || {};
        var value = check(helpers[key], crawlObjectUp(helpers, keys));
        if (value === undefined) {
            value = crawlObjectUp(_data, keys);
        }
        if (value !== undefined) {
            return value;
        }
        for (var n = data.extra.length; n--; ) {
            value = check(data.extra[n][key], crawlObjectUp(data.extra[n], keys));
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
        var isString = value.charAt(0) === '"' || value.charAt(0) === "'";
        var isInline = false;
        var depth = 0;
        var keys = [];
        var path = [];
        var strict = false;
        var active = value.charAt(1) === "%" ? 2 : value.charAt(0) === "%" ? 1 : 0;
        if (isString) {
            value = value.replace(/(?:^['"]|['"]$)/g, "");
        } else {
            value = active ? value.substr(active) : value;
            path = value.split("../");
            if (path.length > 1) {
                value = (path[0] === "@" && "@" || "") + path.pop();
                depth = path.length;
            }
            name = name.replace(/^(?:\.|this)\//, function() {
                strict = true;
                return "";
            });
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
            partial: char0 === ">" && (_this.partials[_data.name] || _this.partials[_this.options.recursion]),
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
        return function fastReplace(data) {
            return replace(_this, data, text, sections, extType, parts);
        };
    }
    function replace(_this, data, text, sections, extType, parts) {
        var out = "";
        var _out = "";
        var _fn = null;
        var _data = {};
        var newData = {};
        var part = {};
        for (var n = 0, l = text.length; n < l; n++) {
            part = parts[n];
            if (part === undefined) {
                out = extType ? render(_this, {}, data, _fn, out, text[n], extType) : out + text[n];
                continue;
            }
            out = out + text[n];
            if (part.section) {
                out = render(_this, part, data, _fn = sections[part.section], out, _fn(data), extType);
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
                newData = {};
                for (var item in data.path[0]) {
                    newData[item] = data.path[0][item];
                }
                for (var key in part.parts) {
                    _data = part.parts[key];
                    newData[key] = _data.isString ? _data.value : findData(data, _data.value, _data.keys, _data.depth);
                }
                newData = getSource(newData);
                newData.helpers = [ data.helpers[0] ];
                newData.extra = [ data.extra[0] ];
                _out = part.partial(newData);
            } else {
                part.parent = crawlObjectUp(data.helpers, [ 0, "_parent" ]);
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
            var fn = !part.strict && _this.helpers[part.name] || isFunction(out) && out;
            out = fn ? apply(_this, fn, part.name, part.vars, data, part) : out && (part.isUnescaped ? out : escapeHtml(out, _this));
            return out;
        };
    }
    function section(_this, fn, name, vars, unEscaped, isNot) {
        var type = name;
        name = getVar(vars.length && (name === "if" || name === "each" || name === "with" || name === "unless") ? vars.shift() : name);
        vars = splitVars(_this, vars, getVar(name.name), unEscaped, "");
        return function fastLoop(data) {
            return loop(_this, data, fn, name, vars, isNot, type);
        };
    }
    function loop(_this, data, fn, name, vars, isNot, type) {
        var _data = findData(data, name.name, name.keys, name.depth);
        var helper = !name.strict && (_this.helpers[name.name] || isFunction(_data) && _data);
        var helperOut = helper && apply(_this, helper, name.name, vars.vars, data, vars, fn[0], fn[1]);
        var _isArray = isArray(_data);
        var objData = type === "each" && !_isArray && typeof _data === "object" && _data;
        var out = "";
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
                out = out + fn[0](data);
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
    function sizzleTemplate(_this, text) {
        var _text = "";
        var sections = [];
        var tags = _this.options.tags;
        while (_text !== text && (_text = text)) {
            text = text.replace(_this.sectionRegExp, function(all, start, type, name, vars, end, rest) {
                if (type === "#*") {
                    _this.registerPartial(vars.replace(/(?:^['"]|['"]$)/g, ""), rest);
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
    function resolveReferences(_this, memory, html, container, fragment) {
        var search = new RegExp("{{#\\d+}}[\\S\\s]*{{/\\d+}}");
        var helperContainer = document.createElement("tbody");
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
        helperContainer.innerHTML = html || "";
        for (var n = memory.length; n--; ) {
            first = "{{#" + n + "}}";
            last = "{{/" + n + "}}";
            part = memory[n];
            foundNode = findNode(helperContainer, first);
            if (!foundNode) {
                window.console && console.warn("There might be an error in the SCHNAUZER template");
            } else if (foundNode.ownerElement) {
                part.replacer = function(elm, ownerElement, name, search, orig, item) {
                    return function updateAttribute(keys, _value) {
                        var value = _value || item.fn(item.data, keys);
                        if (value === undefined) value = "";
                        if (options.attributes[name]) {
                            elm = null;
                            options.attributes[name](ownerElement, name, value);
                        } else if (value !== undefined) {
                            elm.textContent = orig.replace(search, value);
                        }
                    };
                }(foundNode, foundNode.ownerElement, foundNode.name, search, foundNode.textContent, part);
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
        for (var n = options.listeners.length; n--; ) {
            if (!options.listeners[n]) continue;
            _options.listeners[n] = options.listeners[n].split(pathSplit);
        }
        rootItem[_options.childNodes] = _this.model;
        reinforceProperty(_this.model, "root", rootItem);
        enrichModel(_this, _this.model);
    }, pathSplit = /\.|\//, NODES = [], idCounter = 0;
    VOM.prototype = {
        getElementById: function(id) {
            return NODES[this.id][id];
        },
        getElementsByProperty: function(property, value) {
            var result = [], hasValue = undefined !== value, hasProperty = undefined !== property, keys = [], propValue = null;
            for (var id in NODES[this.id]) {
                propValue = undefined !== NODES[this.id][id][property] ? NODES[this.id][id][property] : crawlObject(NODES[this.id][id], keys[0] ? keys : keys = hasProperty && property.split(pathSplit));
                if (hasValue && propValue === value || !hasValue && undefined !== propValue || !hasValue && !hasProperty) {
                    result.push(NODES[this.id][id]);
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
            return addProperty(_this, property.split(pathSplit)[0], {
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
        return (item.parentNode ? getChildNodes(item.parentNode, _this.options.childNodes) : _this.model).indexOf(item);
    }
    function getChildNodes(item, childNodes) {
        item[childNodes] = item[childNodes] || [];
        return item[childNodes];
    }
    function moveItem(_this, item, parent, index, type, sibling) {
        var options = _this.options;
        options.moveCallback.call(_this, item, type, sibling);
        if (!item.parentNode) {
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
            if (!item[idProperty]) {
                item[idProperty] = "vom_" + idCounter++;
                hasOwnId = false;
            }
            NODES[_this.id][item[idProperty]] = item;
            isNew = !item.parentNode;
            item.parentNode = parent || _this.model.root;
            item.index = 0;
            if (isNew) {
                reinforceProperty(item, idProperty, item[idProperty], hasOwnId);
                addProperty(_this, "index", {
                    current: item
                }, null, true);
                addProperty(_this, "parentNode", {
                    current: item
                }, null, true);
                enhanceModel(_this, item, _this.options.listeners);
            }
            options.preRecursionCallback.call(_this, item, type, sibling);
            item[options.childNodes] && enrichModel(_this, item[options.childNodes], item);
            options.enrichModelCallback.call(_this, item, type, sibling);
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
                addProperty(_this, listener[listener.length - 1], {
                    current: recModel ? deepModel : model,
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
            writable: !!writeable,
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

(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory(root, require("toolbox"), require("blick"), require("VOM"));
    } else if (typeof define === "function" && define.amd) {
        define("circular", [ "toolbox", "blick", "VOM" ], function(Toolbox, Blick, VOM) {
            return factory(root, Toolbox, Blick, VOM);
        });
    } else root.Circular = factory(root, root.Toolbox, root.Blick, root.VOM);
})(this, function(window, Toolbox, Blick, VOM, undefined) {
    "use strict";
    var Circular = function(name, options) {
        this.options = {
            componentAttr: "cr-component",
            containerAttr: "cr-container",
            templateAttr: "cr-template-for",
            templatesAttr: "cr-template",
            eventAttribute: "cr-event",
            viewAttr: "cr-view",
            devAttribute: "cr-dev",
            mountAttribute: "cr-mount",
            elements: "elements",
            events: "events",
            views: "views",
            hash: "#"
        };
        initCircular(this, name, options);
    }, initCircular = function(_this, name, options) {
        var hasName = typeof name === "string";
        if (!hasName) {
            options = name;
        }
        for (var option in options) {
            _this.options[option] = options[option];
        }
        _this.version = "0.1.0";
        _this.components = {};
        _this.data = {};
        _this.id = "cr_" + id++;
        _this.Toolbox = Toolbox;
        _this.name = hasName ? name : _this.id;
    }, Controller = function(options) {
        this.options = {
            appElement: document.body,
            eventAttribute: "cr-event"
        };
        initController(this, options);
    }, initController = function(_this, options) {
        for (var option in options) {
            _this.options[option] = options[option];
        }
        _this.events = {};
    }, _animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(cb) {
        cb();
    }, $ = Toolbox.$, $$ = Toolbox.$$, id = 0, instanceList = {}, templateCache = {}, resourceCache = null, DOC = null, pubsub = {}, routes = [], appComponents = {};
    Circular.prototype.component = function(name, parameters) {
        if (this.components[name]) {
            return this.components[name].reset(parameters.model, parameters.extraModel);
        }
        this.data[name] = {};
        var _this = this, _inst = {}, proto = {}, options = this.options, elmsTxt = options.elements, componentAttr = options.componentAttr, componentSelector = attrSelector(componentAttr, name), componentElement = parameters.componentElement || $(componentSelector, parameters.componentWrapper || document);
        if (!componentElement) return;
        var nestingData = checkRestoreNesting(componentElement, componentAttr), altName = componentElement && componentElement.getAttribute("name"), data = getDomData(options, parameters, componentElement, altName || name), component = this.components[name] = {
            name: name,
            model: parameters.model || [],
            element: data.element,
            container: data.container,
            templates: data.templates
        }, hasStorage = parameters.storage, storage = hasStorage || {}, storageHelper = Toolbox.storageHelper, storageData = hasStorage && storageHelper.fetch(storage.name) || {}, storageCategory = storage.category, storageListeners = storage.listeners || parameters.listeners, storageAll = storage.storeAll || storageListeners && storageListeners.indexOf("*") !== -1, mountSelector = parameters.mountSelector || attrSelector(options.mountAttribute), template = parameters.template;
        this.data[name].extraModel = parameters.extraModel || options.extraModel;
        pubsub[this.name] = pubsub[this.name] || {};
        pubsub[this.name][name] = {};
        instanceList[this.id] = instanceList[this.id] || {};
        _inst = instanceList[this.id][name] = {};
        _inst.helper = document.createElement("tbody");
        parameters.onBeforeInit && parameters.onBeforeInit(component);
        _inst.controller = parameters.eventListeners && new Controller({
            appElement: data.element,
            eventAttribute: options.eventAttribute,
            eventListeners: parameters.eventListeners,
            instanceID: _this.id
        });
        _inst.collector = {};
        _inst.template = template && template.version ? template : templateCache[name] ? templateCache[name] : data.template ? new Blick(template || data.template, {
            doEscape: false,
            helpers: parameters.helpers || options.helpers || {},
            decorators: parameters.decorators || options.decorators || {},
            attributes: parameters.attributes || options.attributes || {},
            registerProperty: function(name, fn, data, active, parent) {
                var noGetter = parent && data[parent[0]] && !Object.getOwnPropertyDescriptor(data[parent[0]], "0").get;
                var _parent = parent ? parent.slice(0) : parent;
                parent && noGetter && _parent.push(name);
                var blickItem = _inst.collector[data["cr-id"]] = _inst.collector[data["cr-id"]] || {};
                var _name = _parent && _parent.join(".") || name;
                blickItem[_name] = blickItem[_name] || [];
                blickItem[_name].push({
                    fn: fn,
                    forceUpdate: active === 2,
                    parent: parent && (name !== "this" && name !== "." ? parent.concat(name.split(".")) : parent)
                });
            }
        }) : null;
        _inst.template && (templateCache[name] = _inst.template);
        if (hasStorage) {
            var _data = storageData[storageCategory] || storageData;
            for (var key in component.model[0]) {
                if (_data && _data[key] !== undefined) {
                    component.model[0][key] = _data[key];
                }
            }
        }
        _inst.vom = new VOM(component.model, {
            idProperty: _this.options.idProperty || "cr-id",
            preRecursionCallback: function(item, type, siblingOrParent) {
                var idProperty = this.options.idProperty, id = item[idProperty], fragment = _inst.template && _inst.template.schnauzer.partials.self && _inst.template.renderHTML(item, _this.data[name].extraModel), replaceElement = type === "replaceChild" && siblingOrParent[elmsTxt].element, container = item.parentNode[elmsTxt] && item.parentNode[elmsTxt].container, parentNode = fragment && siblingElement || container || component.container, siblingElement = parentNode ? replaceElement || undefined : siblingOrParent && siblingOrParent[elmsTxt].element, element = fragment && render(_inst.helper, fragment, type || data.type || "appendChild", parentNode, siblingElement, idProperty, id) || component.element;
                this.reinforceProperty(item, elmsTxt, {
                    element: element,
                    container: $(mountSelector, element)
                }, true);
                this.reinforceProperty(item, options.events, {}, true);
                _inst.controller && _inst.controller.getEventListeners(item[elmsTxt].element || component.element, item[options.events], component, idProperty);
                this.reinforceProperty(item, options.views, {}, true);
                getViews(options, item[options.views], item[elmsTxt].element || component.element);
                parameters.preRecursionCallback && parameters.preRecursionCallback.call(this, item);
            },
            enrichModelCallback: this.options.enrichModelCallback || parameters.enrichModelCallback || function() {},
            listeners: this.options.listeners || parameters.listeners || [],
            subscribe: function(property, item, value, oldValue, sibling) {
                var idProperty = this.options.idProperty, id = item[idProperty], element = item[elmsTxt] && item[elmsTxt].element, parentElement = item.parentNode && item.parentNode[elmsTxt] ? item.parentNode[elmsTxt].container || item.parentNode[elmsTxt].element : component.container, blickItem = [];
                if (property === "removeChild") {
                    render(_inst.helper, element, property, element.parentElement);
                    delete _inst.collector[id];
                } else if (property === "sortChildren") {
                    render(_inst.helper, element, "appendChild", parentElement);
                } else if (this[property]) {
                    if (item === sibling) {
                        element = render(_inst.helper, _inst.template.renderHTML(item, _this.data[name].extraModel), property, parentElement, sibling[elmsTxt].element, idProperty, item[idProperty]);
                        item[elmsTxt].element = element;
                        item[elmsTxt].container = $(mountSelector, element);
                        item[options.events] = {};
                        _inst.controller && _inst.controller.getEventListeners(item[elmsTxt].element || component.element, item[options.events], component, this.options.idProperty);
                        item[options.views] = {};
                        getViews(options, item[options.views], item[elmsTxt].element || component.element);
                    } else if (property !== "replaceChild" && !item.__isNew) {
                        render(_inst.helper, element, property, parentElement, sibling[elmsTxt] && sibling[elmsTxt].element);
                    }
                } else if (hasStorage && (storageAll || storageListeners.indexOf(property) !== -1)) {
                    storageData = storageHelper.fetch(storage.name) || {};
                    if (!storageAll) {
                        storageData[storageCategory] = storageData[storageCategory] || {};
                        storageData[storageCategory][property] = value;
                    } else {
                        storageData[storageCategory] = component.model[0];
                    }
                    storageHelper[storage.saveLazy === false ? "save" : "saveLazy"](storageCategory ? storageData : storageData[storageCategory], storage.name, this);
                }
                if (blickItem = _inst.collector[id] && _inst.collector[id][property]) {
                    for (var n = blickItem.length, elm; n--; ) {
                        if (blickItem[n].forceUpdate || value !== oldValue) {
                            elm = blickItem[n].fn(blickItem[n].parent);
                            if (_inst.controller && elm) for (var m = elm.length; m--; ) {
                                _inst.controller.getEventListeners(elm[m], item[options.events], component, idProperty, true);
                            }
                        }
                    }
                }
                parameters.subscribe && parameters.subscribe.call(this, property, item, value, oldValue);
                _this.publish(component, name, property, {
                    property: property,
                    item: item,
                    value: value,
                    oldValue: oldValue
                });
            }
        });
        checkRestoreNesting(null, null, nestingData);
        proto = transferMethods(VOM, _inst.vom, component, this, proto);
        proto.uncloak = function(item) {
            var item = item && item.element || component.element;
            Toolbox.removeClass(item, "cr-cloak");
            item.removeAttribute("cr-cloak");
        };
        proto.reset = function(data, extraModel) {
            if (extraModel) {
                _this.data[component.name].extraModel = extraModel;
            }
            _inst.vom.destroy();
            this.container && (this.container.innerHTML = "");
            for (var n = 0, m = data.length; n < m; n++) {
                data[n].__isNew = true;
                this.appendChild(data[n]);
                delete data[n].__isNew;
            }
            return component;
        };
        component.__proto__ = proto;
        parameters.onInit && parameters.onInit(component);
        return component;
    };
    Circular.prototype.destroy = function(name) {
        var _instList = instanceList[this.id];
        var _instance = {};
        for (var component in _instList) {
            if (name && name !== component) continue;
            for (var instance in _instList[component]) {
                _instance = _instList[component][instance];
                _instance && _instance.destroy && _instance.destroy(component);
            }
        }
    };
    Circular.prototype.model = function(model, options) {
        return new VOM(model, options);
    };
    Circular.prototype.template = function(template, options) {
        return new Blick(template, options);
    };
    Circular.Toolbox = Toolbox;
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
        inst = inst || this.name;
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
            pubsubs[n].call(_this, data);
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
    Circular.prototype.loadResource = function(fileName, cache) {
        var _this = this, devFilter = function(elm) {
            return !elm.hasAttribute(_this.options.devAttribute);
        };
        return Toolbox.ajax(fileName, {
            cache: cache
        }).then(function(data) {
            var scripts = [];
            var path = fileName.split("/").slice(0, -1);
            DOC = DOC || document.implementation.createHTMLDocument("");
            DOC.documentElement.innerHTML = data;
            scripts = [].slice.call($$("script", DOC) || []).filter(function(elm) {
                if (elm.getAttribute("type") === "text/javascript") {
                    elm.parentNode.removeChild(elm);
                    return devFilter(elm);
                }
                return false;
            });
            return {
                links: [].slice.call($$("link", DOC) || []).filter(devFilter),
                styles: [].slice.call($$("style", DOC) || []).filter(devFilter),
                scripts: scripts,
                body: $("body", DOC),
                head: $("head", DOC),
                path: path.join("/")
            };
        }).catch();
    };
    Circular.prototype.insertResources = function(container, data) {
        var body = $(attrSelector(this.options.devAttribute, "container"), data.body) || data.body;
        Toolbox.requireResources(data, "styles", container);
        while (body.childNodes[0]) {
            container.appendChild(body.childNodes[0]);
        }
        return Toolbox.requireResources(data, "scripts", container);
    };
    Circular.prototype.insertModule = function(fileName, container) {
        var _this = this;
        return this.loadResource(fileName, true).then(function(data) {
            return _this.insertResources(container, data).then(function() {
                return data.path;
            });
        });
    };
    function moveChildrenToCache(data) {
        var children = [].slice.call(data.container.childNodes);
        for (var n = 0, m = children.length; n < m; n++) {
            appComponents[data.previousName].cache.appendChild(children[n]);
        }
    }
    Circular.prototype.renderModule = function(data) {
        var cache = null, temp = null, isInsideDoc = data.container, components = appComponents, name = data.name;
        if (components[data.previousName]) {
            moveChildrenToCache(data);
        }
        if (name && components[name]) {
            data.container.appendChild(components[name].cache);
            components[name].init && data.init !== false && components[name].init(data.data, components[name].path);
            return new Toolbox.Promise(function(resolve) {
                resolve(components[name].init);
            });
        }
        cache = document.createDocumentFragment();
        if (!isInsideDoc) {
            temp = document.createElement("div");
            temp.style.display = "none";
            document.body.appendChild(temp);
        }
        return name ? this.insertModule(data.path, data.container || temp).then(function(path) {
            return new Toolbox.Promise(function(resolve) {
                var moduleName = data.require === true ? name : data.require === false ? "" : data.require;
                components[name] = {
                    path: path,
                    cache: cache
                };
                if (moduleName) {
                    require([ moduleName ], function(init) {
                        components[name].init = init;
                        data.init !== false && init(data.data, path);
                        if (!isInsideDoc) {
                            data.container = temp;
                            moveChildrenToCache(data);
                            temp.parentElement.removeChild(temp);
                        }
                        resolve(init);
                    });
                } else if (temp) {
                    moveChildrenToCache(data);
                    temp.parentElement.removeChild(temp);
                    resolve();
                }
            });
        }).catch() : new Toolbox.Promise(function(a) {
            a();
        });
    };
    Controller.prototype = {
        getEventListeners: function(element, events, component, idProperty, extra) {
            var eventAttribute = this.options.eventAttribute, elements = element.querySelectorAll(attrSelector(eventAttribute)), attribute = "", eventItem = "", eventType = "", eventFunc = "", eventParts = [], eventFuncs = {}, extraElement = element !== component.element ? component.element : [];
            elements = [ element ].concat([].slice.call(elements), extraElement);
            for (var n = elements.length; n--; ) {
                attribute = elements[n].getAttribute(eventAttribute);
                if (!attribute) {
                    continue;
                }
                eventParts = attribute.split(/\s*;+\s*/);
                for (var m = eventParts.length; m--; ) {
                    eventItem = eventParts[m].split(/\s*:+\s*/);
                    eventType = eventItem[0];
                    eventFunc = eventItem[1];
                    eventFuncs = events[eventType] = events[eventType] || {};
                    if (eventFuncs[eventFunc] === undefined) {
                        eventFuncs[eventFunc] = [];
                    }
                    eventFuncs[eventFunc].push(elements[n]);
                    if (!this.events[eventType]) {
                        this.events[eventType] = true;
                    }
                }
            }
            if (!this.installed || extra) {
                this.installEventListeners(component, idProperty);
            }
        },
        installEventListeners: function(component, idProperty) {
            var that = this;
            this.installed = this.installed || {};
            for (var key in this.events) {
                if (this.installed[key]) continue;
                Toolbox.addEvent(this.options.appElement, key, function(e) {
                    eventDistributor(e, idProperty, component, that);
                }, /(?:focus|blur|mouseenter|mouseleave)/.test(key) ? true : false, this.options.instanceID + "_" + component.name);
                this.installed[key] = true;
            }
        },
        destroy: function(component) {
            Toolbox.removeEvent(this.options.instanceID + "_" + component.name);
        }
    };
    return Circular;
    function render(helper, html, operator, parentNode, sibling, idProperty, id) {
        var isPrepend = operator === "prependChild", element = {};
        if (html.nodeType === 11) {
            element = html.children[0];
            element.setAttribute(idProperty, id);
        } else {
            element = html;
        }
        var renderingFunc = function() {
            if (isPrepend || operator === "insertAfter") {
                sibling = sibling && sibling.nextSibling || isPrepend && parentNode.children[0];
                operator = sibling ? "insertBefore" : "appendChild";
            }
            (parentNode || element.parentElement)[operator](element, sibling);
        };
        element && renderingFunc();
        return element;
    }
    function getViews(options, views, element) {
        var elements = $$(attrSelector(options.viewAttr), element), attribute = "";
        elements = [ element ].concat([].slice.call(elements));
        for (var n = elements.length; n--; ) {
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
                proto[method] = function(method) {
                    return function() {
                        return fromInstance[method].apply(fromInstance, arguments);
                    };
                }(method);
            }
        }
        return proto;
    }
    function checkRestoreNesting(comp, attr, restore) {
        var temp = [], tempContainer = checkRestoreNesting.tempContainer = checkRestoreNesting.tempContainer || document.createDocumentFragment(), restores = [], collect = {};
        if (restore) {
            for (var n = restore.length; n--; ) {
                collect = restore[n];
                collect[2][collect[1] ? "insertBefore" : "appendChild"](collect[0], collect[1]);
                restore[n] = null;
            }
        } else if (comp && attr) {
            temp = $$(attrSelector(attr), comp);
            if (temp.length !== 0) {
                for (var n = 0, m = temp.length; n < m; n++) {
                    collect = temp[n];
                    restores.push([ collect, collect.nextElementSibling, collect.parentNode ]);
                    tempContainer.appendChild(collect);
                }
            }
            return restores;
        }
    }
    function processTemplate(template, options) {
        var isScript = template.tagName.toLowerCase() === "script";
        var html = "";
        if (!isScript) {
            template.removeAttribute(options.templateAttr);
            html = template.outerHTML;
            template.parentNode.removeChild(template);
            return html;
        }
        return template.innerHTML;
    }
    function getDomData(options, parameters, component, name) {
        var searchContainer = component || document.body, containerAttr = options.containerAttr, container = component.hasAttribute(containerAttr) ? component : $(attrSelector(containerAttr, name), component) || $(attrSelector(containerAttr), component), _template, type = container && container.getAttribute(options.containerAttr), template = $(attrSelector(options.templateAttr, name), searchContainer), _templates = $$(attrSelector(options.templatesAttr, name), searchContainer) || [], templates = {};
        for (var n = _templates.length; n--; ) {
            _template = processTemplate(_templates[n], options);
            templates[_templates[n].id || _templates[n].getAttribute("name")] = new Blick(_template, {
                doEscape: false,
                helpers: parameters.helpers || options.helpers || {}
            });
        }
        return {
            element: component,
            template: template ? processTemplate(template, options) : template,
            templates: templates,
            container: container,
            type: type ? type + "Child" : ""
        };
    }
    function attrSelector(attr, value) {
        return "[" + attr + (value ? '="' + value + '"]' : "]");
    }
    function isConnected(elm, contect) {
        return elm.isConnected !== undefined ? elm.isConnected : _this.options.appElement.contains(eventElement);
    }
    function eventDistributor(e, idProperty, component, _this) {
        var element = Toolbox.closest(e.target, attrSelector(idProperty)) || component.element, id = element.getAttribute(idProperty), elms = "elements.element", item = component.getElementById(id) || component.getElementsByProperty(elms, component.element)[0] || component.getElementsByProperty(elms, e.target)[0] || component.model[0], eventElements = item && item.events[e.type], eventElement = {}, stopPropagation = false, eventListener;
        for (var key in eventElements) {
            eventListener = _this.options.eventListeners[key];
            if (!eventListener) continue;
            for (var n = eventElements[key].length; n--; ) {
                eventElement = eventElements[key][n];
                if (!isConnected(eventElement, _this.options.appElement)) {
                    eventElements[key].splice(n, 1);
                    continue;
                }
                if (!stopPropagation && (eventElement === e.target || eventElement.contains(e.target))) {
                    stopPropagation = eventListener.call(component, e, eventElement, item) === false;
                    if (stopPropagation) e.stopPropagation();
                }
            }
        }
    }
});