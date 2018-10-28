(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(root);
  } else if (typeof define === 'function' && define.amd) {
    define('toolbox', [], function () {
      return factory(root);
    });
  } else {
    root.Toolbox = factory(root);
  }
}(this, function(window, undefined) {
  'use strict';

  var resourceCache = null,
    _link = document.createElement('a'),
    Toolbox = {
    closest: function(element, selector, root) {
      if (element.closest) {
        Toolbox.closest = function(element, selector) {
          return element.closest(selector);
        }
      } else {
        var matches = (element.msMatchesSelector ||
          element.webkitMatchesSelector || element.matches);

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

    addEvents: function (elements, type, func, cap, _this) {
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
      Toolbox.addEvent.events.push({ // cache references for reliable removal
        e: element,
        t: type,
        f: func,
        c: cap,
        i: (_this || Toolbox)
      });

      element.addEventListener(type, func, cap);
    },

    removeEvent: function(_this, element, type) { // removes all events from nameSpace
      var item = {},
        elmCondition = false,
        n = 0;

      for (n = (Toolbox.addEvent.events || []).length; n--; ) {
        item = Toolbox.addEvent.events[n];
        elmCondition = !element ||
          (item.e === element && (!type || type === item.t));
        if (item.i === (_this || Toolbox) && elmCondition) {
          item.e.removeEventListener(item.t, item.f, item.c);
          Toolbox.addEvent.events.splice(n, 1);
        }
      }
    },
    storageHelper: {
      fetch: function (key) {
        var data = localStorage.getItem(key);
        return data ? JSON.parse(data) : data;
      },
      saveLazy: function (data, key, obj) {
        Toolbox.lazy(function() {
          Toolbox.storageHelper.save(data, key);
        }, obj || Toolbox.storageHelper);
      },
      save: function (data, key) {
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

      return asc ?
        textA < textB ? 1 : textA > textB ? -1 : 0 :
        textA < textB ? -1 : textA > textB ? 1 : 0;
    },

    normalizePath: function(path) {
      _link.href = path;
      return (path.indexOf(_link.host) !== -1 ? _link.origin : '') +
        _link.pathname + _link.search;
    },

    ajax: function(url, prefs) {
      var promise = null;
      var cache = false;
      var now = new Date().getTime();
      var time = 0;

      prefs = prefs || {};
      url = Toolbox.normalizePath(url);
      time = ajaxCache[url] && ajaxCache[url].time || 0;
      cache = prefs.cache === true ? now + 1e8 : // 1e8 ~= 1 year
        !prefs.cache ? 0 : (time > now ? time : now + prefs.cache);
      promise = cache && !prefs.resetCache && time > now ? ajaxCache[url] : null;

      promise = promise || new Toolbox.Promise(function(resolve, reject) {
          var xhr = new XMLHttpRequest();
          var method = (prefs.method || prefs.type || 'GET').toUpperCase();

          if (!xhr) {
            reject('Giving up :( Cannot create an XMLHTTP instance');
          }

          if (!prefs) { // if no prefs defined then url is actually prefs
            prefs = url;
            url = prefs.url;
          }
          xhr.onreadystatechange = function() {
            var data = getXHRData(this, prefs.dataType, reject);

            if (data !== undefined) {
              if (prefs.dataType === 'json') {
                try {
                  data = JSON.parse(data);
                } catch(e) {
                  reject('Caught Exception: ' + e.stack);
                  return;
                }
              }
              resolve(data);
            }
          };
          xhr.open(method, url, prefs.async || true, prefs.username, prefs.password);

          if (prefs.dataType === 'xml') {
            xhr.setRequestHeader('Content-Type', 'text/xml');
          }
          if (method !== 'GET' && prefs.csrf) {
            xhr.setRequestHeader('X-CSRF-Token', getCSRFToken(prefs.csrf));
          }
          if (prefs.headers) { // add more headers
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

    requireResources: function (data, type, container) {
      var promises = [];
      var item = null;
      var resourceName = '';
      var absolute = false;
      var path = '';
      var text = '';
      var isStyles = type === 'styles';
      var attribute = isStyles ? 'href' : 'src';
      var items = isStyles ? data.styleSheets : data.scripts;
      var cache = resourceCache = resourceCache || Toolbox.captureResources();

      while (item = items.shift()) {
        resourceName = item.getAttribute(attribute);
        absolute = resourceName && resourceName.indexOf('://') !== -1;
        path = Toolbox.normalizePath(data.path && !absolute ?
          data.path + '/' + resourceName : '' + resourceName);
        if (resourceName && cache[path]) continue;
        if (!isStyles) { // scripts
          text = item.text;
          item = document.createElement('script');
          item.setAttribute('type', 'text/javascript');
          item.async = true;
          if (!resourceName) { // inline script
            item.text = text;
          }
        }
        if (resourceName) {
          item[attribute] = path;
          document.head.appendChild(item);
          cache[path] = item;
        }

        promises.push(new Toolbox.Promise(function(resolve) {
          if (resourceName && item.onload !== undefined) { // scripts and links
            item.onload = function() {
              resolve(this);
            };
          } else { // inline styles or scripts
            !resourceName && (isStyles ? container : document.body).appendChild(item);
            resolve(item);
          }
        }));
      }

      return Toolbox.Promise.all(promises);
    },

    captureResources: function() {
      var cache = {};
      var resources = [].slice.call(document.scripts)
          .concat([].slice.call(Toolbox.$$('link', document)));
      var path = '';

      for (var n = resources.length; n--; ) {
        path = resources[n].getAttribute('src') ||
          resources[n].getAttribute('href');

        if (path) { // no inline scripts
          path = Toolbox.normalizePath(path);
          cache[path] = resources[n];
        }
      }

      return cache;
    }
  }

  window.Event = window.Event || function Event(event, params) {
    var evt = document.createEvent('CustomEvent');

    params = params || {};
    evt.initCustomEvent(event,
      params.bubbles || false, params.cancelable || false, params.detail);
    return evt;
  }

  /* --------- AJAX ---------- */

  var ajaxCache = {};

  function getCSRFToken(cookieKey) {
    var start = document.cookie.split(cookieKey + '=')[1];

    return start && start.split(';')[0];
  }

  function getXHRData(xhr, dataType, reject) {
    try {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status < 200 || xhr.status > 299) {
          var error = new Error(xhr.statusText);
          error.response = xhr.response;
          reject(error);
        } else {
          return xhr[dataType === 'xml' ?
            'responseXML' : 'responseText'];
        }
      }
    } catch(e) {
      reject('Caught Exception: ' + e.stack);
    }
  }
  /* ---------------- Promise --------------- */

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
        } else if (typeof then === 'function') {
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
          console.warn('Possible Unhandled Promise Rejection:', self._value);
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
    var rejectFn = function (value) {
        if (done) return;
        done = true;
        reject(self, value);
      };

    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, rejectFn);
    } catch (ex) {
      rejectFn(ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected || function(error) {
      console.error(error);
    });
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var promise = new Promise(function() {});

    handle(this, {
      onFulfilled: onFulfilled || null,
      onRejected: onRejected || null,
      promise: promise
    });
    return promise;
  };

  Promise.prototype.cancel = function (id) {
    var promise = Promise._cache[id];

    if (promise) {
      promise._deferreds = [];
      promise.then = promise['catch'] = function(){};
      promise._handled = true;
    }

    return (Promise._cache[id] = this);
  };

  Promise.all = function(promises) {
    var results = [];
    var merged = promises.reduce(function(accumulator, promise) {
        return accumulator.then(function() {
          return promise;
        }).then(function(result) {
          return results.push(result);
        })
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
        cache: resource.name.substr(0, 2) !== '!!'
      }).then(function(data) {
        resource.done = data;
        markAsDone(resource);
      })
    }
  }

  return Toolbox;
}));
