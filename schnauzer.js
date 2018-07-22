/**! @license schnauzer v1.3.0; Copyright (C) 2017-2018 by Peter Dematté */
(function defineSchnauzer(root, factory) {
  if (typeof exports === 'object') module.exports = factory(root);
  else if (typeof define === 'function' && define.amd) define('schnauzer', [],
    function () { return factory(root); });
  else root.Schnauzer = factory(root);
}(this, function SchnauzerFactory(root, undefined) { 'use strict';

var Schnauzer = function(template, options) {
    this.version = '1.3.0';
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
      decorators: {},
      partials: {},
      recursion: 'self',
      characters: '$"<>%-=@',
      splitter: '|##|',
      tools: undefined, // hook for helpers/decorators
    };
    init(this, options || {}, template);
  },
  init = function(_this, options, template) {
    for (var option in options) {
      _this.options[option] = options[option];
    }
    options = _this.options;

    _this.entityRegExp = new RegExp('[' + getKeys(options.entityMap, []).join('') + ']', 'g');
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
  },
  isArray = Array.isArray || function(obj) { // obj instanceof Array;
    return obj && obj.constructor === Array;
  },
  isFunction = function(obj) {
    return obj && typeof obj === 'function';
  },
  getKeys = Object.keys || function(obj, keys) { // keys = []
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
    return this.partials[name] =
      (this.partials[name] || sizzleTemplate(this, text));
  },
  unregisterPartial: function(name) {
    delete this.partials[name];
  },
  setTags: function(tags) {
    switchTags(this, tags);
  },
};

return Schnauzer;

function switchTags(_this, tags) {
  var _tags = tags[0] === '{{' ? ['{{2,3}', '}{2,3}'] : tags;
  var chars = _this.options.characters + '\\][';

  _this.inlineRegExp = new RegExp('(' + _tags[0] + ')' +
    '([>!&=])*\\s*([\\w\\'+ chars + '\\.]+)\\s*([\\w' + chars + '\\.\\s]*)' + _tags[1], 'g');
  _this.sectionRegExp = new RegExp('(' + _tags[0] + ')([#^*]*)\\s*([\\w' + chars + ']*)' +
    '(?:\\s+([\\w$\\s|./' + chars + ']*))*(' + _tags[1] + ')((?:(?!\\1[#^])[\\S\\s])*?)' +
    '\\1\\/\\3\\5', 'g');
  _this.elseSplitter = new RegExp(_tags[0] + 'else' + _tags[1]);
}

function concat(array, newArray) { // way faster than [].concat
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
    path: isNew ? [data] : hasNewData ? concat(data.path, [newData]) : data.path,
    helpers: helpers ? concat(_helpers, hasNewData && [helpers] || [{}]) : _helpers,
    __schnauzerData: true,
  };
}

function crawlObjectUp(data, keys) { // faster than while
  for (var n = 0, m = keys.length; n < m; n++) {
    data = data && data[keys[n]];
  }
  return data;
}

function findData(data, key, keys, pathDepth) {
  if (!keys) { // empty data;
    return;
  }

  var _data = data.path[pathDepth] || {};
  var helpers = data.helpers[pathDepth] || {};
  var value = helpers[key] !== undefined ? helpers[key] : crawlObjectUp(helpers, keys);

  if (value === undefined || keys[0] === '.') {
    value = _data[key] !== undefined ? _data[key] : crawlObjectUp(_data, keys);
  }
  if (value !== undefined) {
    return value;
  }
  for (var n = data.extra.length; n--; ) {
    if (data.extra[n][key] !== undefined) {
      return data.extra[n][key];
    }
    value = crawlObjectUp(data.extra[n], keys);
    if (value !== undefined) {
      return value;
    }
  }
}

function getVar(text) {
  if (!text) { // speeds up parsing and live findData()
    return {};
  }

  var parts = text.split(/\s*=\s*/);
  var value = parts.length > 1 ? parts[1] : parts[0];
  var isString = value.charAt(0) === '"' || value.charAt(0) === "'";
  var isInline = false;
  var depth = 0;
  var keys = [];
  var path = [];
  var strict = false;

  if (isString) {
    value = value.replace(/(?:^['"]|['"]$)/g, '');
  } else {
    path = value.split('../');
    if (path.length > 1) {
      value = (path[0] === '@' && '@' || '') + path.pop();
      depth = path.length;
    }
    name = name.replace(/^(?:\.|this)\//, function() {
      strict = true;
      return '';
    });
    keys = value.split(/[\.\/]/);

    value = value.replace(/^(\.\/|this\.|this\/|\*)/, function(all, $1) {
      if ($1 === '*') {
        isInline = true;
        return '';
      }
      strict = true;
      keys[0] = '.'; // findData() -> explicit
      return '';
    }).replace(/(?:^\[|\]$)/g, '');
  }

  return {
    name: parts.length > 1 ? parts[0] : value,
    value: value,
    isString: isString,
    isInline: isInline,
    strict: strict,
    keys: keys,
    depth: depth,
  };
}

function escapeHtml(string, _this) {
  return String(string).replace(_this.entityRegExp, function(char) {
    return _this.options.entityMap[char];
  });
}

function tools(_this, fn, name, params, data, parts, body, altBody) {
  return _this.options.tools ?
    _this.options.tools(_this, findData, getSource, fn, name, params, data, parts, body, altBody) :
    fn.apply({
      getData: function getData(key) {
        key = parts.rawParts[key] || { value: key, keys: [key], depth: 0 };

        return key.isString ? key.value : findData(data, key.value, key.keys, key.depth);
      },
      escapeHtml: function escape(string) {
        return escapeHtml(string, _this)
      },
      getBody: function() {
        return body && body(data) || '';
      },
      gatAltBody: function() {
        return altBody && altBody(data) || '';
      },
      data: data.path[0]
    }, parts.isInline ? [function() {
      return body || '';
    }] : params);
}

function splitVars(_this, vars, _data, unEscaped, char0) {
  var parts = {};
  var rawParts = {};

  for (var n = vars.length, tmp = {}; n--; ) {
    tmp = getVar(vars[n]);
    parts[tmp.name] = tmp;
    rawParts[vars[n]] = tmp; // for tools.getData()
  }
  return {
    name: _data.name,
    vars: vars,
    parts: parts,
    rawParts: rawParts,
    partial: char0 === '>' &&
      (_this.partials[_data.name] || _this.partials[_this.options.recursion]),
    isInline: _data.isInline,
    isUnescaped: !_this.options.doEscape || char0 === '&' || unEscaped,
    depth: _data.depth,
    strict: _data.strict,
    keys: _data.keys,
  };
}

function createHelper(value, name, helperData, len, n) {
  var helpers = len ? {
    '@index': n,
    '@last': n === len - 1,
    '@first': n === 0,
  } : {};

  helpers['@key'] = name;
  helpers['.'] = helpers['this'] = value;

  if (helperData) {
    helpers[helperData[0]] = value;
    helpers[helperData[1]] = name;
  }
  return helpers;
}

function inline(_this, text, sections) {
  var keys = [];
  var splitter = _this.options.splitter;

  text = text.replace(_this.inlineRegExp, function(all, start, type, name, vars) {
    var char0 = type && type.charAt(0) || '';

    if (name === '-section-') {
      keys.push({ section : vars });
      return splitter;
    }
    if (char0 === '!' || char0 === '=') {
      return '';
    }
    vars = vars.split(/\s+/); // split variables
    if (name === '*') {
      name = name + vars.shift();
    }
    keys.push(splitVars(_this, vars, getVar(name), start === '{{{', char0));

    return splitter;
  }).split(splitter);

  return function fastReplace(data) {
    var out = '';
    var _out = '';
    var _fn = null;
    var _data = {};
    var newData = {};
    var part = {};

    for (var n = 0, l = text.length; n < l; n++) {
      out = out + text[n];
      part = keys[n];
      if (part === undefined) { // no other functions, just text
        continue;
      }
      if (part.section) { // from sizzleTemplate; -section-
        out += sections[part.section](data) || '';
        continue;
      }
      if (part.isInline) { // decorator
        out = tools(_this, _this.decorators[part.name || part.vars[0]],
          part.name, part.vars, data, part, out) || out;
        if (isFunction(out)) {
          out = out();
        }
        continue;
      }
      if (part.partial) { // partial -> executor
        newData = {}; // create new scope (but keep functions in scope)
        for (var item in data.path[0]) {
          newData[item] = data.path[0][item];
        }
        for (var key in part.parts) {
          _data = part.parts[key];
          newData[key] = _data.isString ?
            _data.value : findData(data, _data.value, _data.keys, _data.depth);
        }
        newData = getSource(newData);
        newData.helpers = [data.helpers[0]];
        newData.extra = [data.extra[0]];
        _out = part.partial(newData);
      } else { // helpers and regular stuff
        _out = findData(data, part.name, part.keys, part.depth);
        _fn = !part.strict && _this.helpers[part.name] || isFunction(_out) && _out;
        _out = _fn ? tools(_this, _fn, part.name, part.vars, data, part) :
          _out && (part.isUnescaped ? _out : escapeHtml(_out, _this));
      }
      if (_out !== undefined) {
        out = out + _out;
      }
    }

    return out;
  };
}

function section(_this, fn, name, vars, unEscaped, isNot) {
  var type = name;
  var helperData = [];

  name = getVar(vars.length && (name === 'if' || name === 'each' ||
    name === 'with' || name === 'unless') ? vars.shift() : name);
  helperData = vars[0] === 'as' && [vars[1], vars[2]];
  vars = splitVars(_this, vars, getVar(name.name), unEscaped, '');

  return function fastLoop(data) {
    var _data = findData(data, name.name, name.keys, name.depth);
    var helper = !name.strict && (_this.helpers[name.name] || isFunction(_data) && _data);
    var helperOut = helper && tools(_this, helper, name.name, vars.vars, data, vars, fn[0], fn[1]);
    var _isArray = isArray(_data);
    var objData = type === 'each' && !_isArray && typeof _data === 'object' && _data;
    var out = '';

    if (helper) { // helpers or inline functions
      data.helpers[0] = createHelper(helperOut, name.name, helperData);
      if (type === 'if') {
        return helperOut ? fn[0](data) : fn[1] && fn[1](data);
      } else if (type === 'unless') {
        return !helperOut ? fn[0](data) : fn[1] && fn[1](data);
      } else {
        _data = helperOut;
        _isArray = isArray(_data);
      }
    }
    if (type === 'unless') {
      _data = !_data;
    } else if (objData) {
      _data = getKeys(_data, []);
    }
    if (_isArray || objData) {
      if (isNot) {
        return !_data.length ? fn[0](_data) : '';
      }
      data.path.unshift({}); // faster then getSource()
      data.helpers.unshift({});
      for (var n = 0, l = _data.length; n < l; n++) {
        data.path[0] = _isArray ? _data[n] : objData[_data[n]];
        data.helpers[0] = createHelper(data.path[0], _isArray ? n : _data[n], helperData, l, n);
        out = out + fn[0](data);
      }
      data.path.shift(); // jump back out of scope-level
      data.helpers.shift();
      return out;
    }
    if (isNot && !_data || !isNot && _data) { // regular replace
      return helper && typeof _data === 'string' ? _data : // comes from helper
        fn[0](type === 'unless' || type === 'if' ? data :
          getSource(data, undefined, _data, createHelper(_data, name.name, helperData)));
    }

    return fn[1] && fn[1](data); // else
  }
}

function sizzleTemplate(_this, text) {
  var _text = '';
  var sections = [];
  var tags = _this.options.tags;

  while (_text !== text && (_text = text)) {
    text = text.replace(_this.sectionRegExp, function(all, start, type, name, vars, end, rest) {
      if (type === '#*') {
        _this.registerPartial(vars.replace(/(?:^['"]|['"]$)/g, ''), rest);
        return '';
      }
      rest = rest.split(_this.elseSplitter);
      sections.push(section(_this,
        [inline(_this, rest[0], sections), rest[1] && inline(_this, rest[1], sections)],
        name, vars && vars.replace(/[(|)]/g, '').split(/\s+/) || [],
        start === '{{{', type === '^'));

      return (tags[0] + '-section- ' + (sections.length - 1) + tags[1]);
    });
  }
  text = inline(_this, text, sections);

  return function executor(data, extra) {
    return text(getSource(data, extra && (isArray(extra) && extra || [extra])));
  };
}

}));
