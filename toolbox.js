/**! @license toolbox v1.0.0; Copyright (C) 2023 by Peter Dematté */
define([], function() {
  'use strict';

var _link = document.createElement('a');
var types = {
    'undefined': undefined,
    'null': null,
    'NaN': NaN,
    'true': true,
    'false': false,
  };
var Toolbox = {
  convertToType: function(value) {
    return types.hasOwnProperty(value) ? types[value] :
    value.toString && +value.toString() === value ? +value : value;
  },
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
  findParent: function(element, selector, root) { // TODO: rename;
    do {
        if (element[selector || 'cr-id']) return element;
        element = element.parentElement || element.parentNode;
    } while (element !== null && element !== root && element.nodeType === 1);
    return null;
  },
  $create: function(tag, className) {
    var elm = document.createElement(tag);

    if (className) {
      elm.className = className;
    }
    return elm;
  },
  $: function(selector, root) {
    return typeof selector === 'string' ?
      (root || document).querySelector(selector) : selector;
  },

  $$: function(selector, root) {
    return (root || document).querySelectorAll(selector);
  },

  // parentsIndexOf: function(elements, target) { // TODO: check if needed
  //   for (var n = elements.length; n--; ) {
  //     if (elements[n].contains(target)) {
  //       return n;
  //     }
  //   }
  //   return -1;
  // },

  keys: function(obj) {
    var result = [];
  
    for (var key in obj) if (obj.hasOwnProperty(key)) result.push(key);
  
    return result;
  },

  cloneObject: function(newObj, obj) {
    var fn = function(obj, newObj, key) { newObj[key] = obj[key] };
    for (var key in obj) fn(obj, newObj, key);
    return newObj;
  },

  isArray: Array.isArray || function(obj) { // obj instanceof Array;
    return obj && obj.constructor === Array;
  },

  addEvent: function(element, type, func, cap) {
    cap = cap !== undefined ? cap :
      /(?:focus|blur|mouseenter|mouseleave|scroll)/.test(type) ? true : false;

    element.addEventListener(type, func, cap);

    return function removeEvent() {
      element.removeEventListener(type, func, cap);
      return element = func = type = cap = null;
    };
  },

  trim: function(text) {
    return text.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  },

  storageHelper: {
    fetch: function (key, inObj) {
      var data = localStorage.getItem(key);
      var parsed = data ? JSON.parse(data) : data;

      return inObj && data ? parsed[inObj] : parsed;
    },
    saveLazy: function (data, key, obj) {
      Toolbox.lazy(function() {
        Toolbox.storageHelper.save(data, key);
      }, obj || Toolbox.storageHelper);
    },
    save: function (data, key, inObj) {
      var obj;

      if (data === null) return localStorage.removeItem(key);
      if (inObj) {
        obj = Toolbox.storageHelper.fetch(key) || {};
        obj[inObj] = data;
        localStorage.setItem(key, JSON.stringify(obj));
      } else localStorage.setItem(key, JSON.stringify(data));
    }
  },
  lazy: function(fn, obj, pref) {
    clearTimeout(obj._timer);
    obj._timer = setTimeout(fn, 0, pref);
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
        var method = (prefs.method || prefs.type || 'GET').toUpperCase();

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
        if (prefs.dataType === 'raw') xhr.responseType = 'blob';

        if (prefs.dataType === 'xml') {
          xhr.setRequestHeader('Content-Type', 'text/xml');
        }
        if (prefs.dataType === 'json') {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }
        if (method !== 'GET' && prefs.csrf) {
          xhr.setRequestHeader('X-XSRF-TOKEN', getCSRFToken(prefs.csrf));
        }
        if (prefs.headers) { // add more headers
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
        return xhr[dataType === 'xml' ? 'responseXML' :
          dataType === 'raw' ? 'response' : 'responseText'];
      }
    }
  } catch(e) {
    reject('Caught Exception: ' + e.stack);
  }
}
/* ---------------- Promise --------------- */

function Promise(fn, staticData) {
  this._state = 0;
  this._handled = false;
  this._value = undefined;
  this._deferreds = [];
  this._returnFn = doResolve(fn, this);
  this._staticData = staticData;
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
    return fn(function (value) {
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
  var _returnFn = this._returnFn;
  var promise = new Promise(function() { return _returnFn });

  handle(this, {
    onFulfilled: onFulfilled || null,
    onRejected: onRejected || null,
    promise: promise
  });
  return promise;
};

Promise.prototype.cancel = function (id) {
  var promise = Promise._cache[id];

  Promise._cache[id] = this;
  if (!promise) return this;

  if (promise._state !== 1) {
    if (promise._returnFn && typeof promise._returnFn === 'function') {
      promise._returnFn();
    }
    promise._deferreds = [];
    promise.then = promise['catch'] = function(){};
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
    var ext = resource.name.substring(resource.name.lastIndexOf('.') + 1).toLowerCase();
    var dataType = /^(?:json|xml)$/.test(ext) ? ext : '';

    Toolbox.ajax(resource.path, {
      cache: resource.name.substr(0, 2) !== '!!',
      dataType: dataType,
    }).then(function(data) {
      resource.done = data;
      markAsDone(resource);
    })
  }
}

return Toolbox;

}, 'toolbox');
