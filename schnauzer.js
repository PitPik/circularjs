/**! @license schnauzer v1.5.0; Copyright (C) 2017-2020 by Peter Dematté */
(function(global, factory) {
  if (typeof exports === 'object') module.exports = factory(global);
  else if (typeof define === 'function' && define.amd)
    define('schnauzer', [], function() { return factory(global); });
  else global.Schnauzer = factory(global);
}(this && this.window || global, function(global, undefined) { 'use strict';

var getObjectKeys = Object.keys || function(obj) {
  var fn = function(obj, key, keys) {obj.hasOwnProperty(key) && keys.push(key)};
  var keys = [];
  for (var key in obj) fn(obj, key, keys);
  return keys;
};
var cloneObject = function(obj, newObj) {
  var fn = function(obj, newObj, key) { newObj[key] = obj[key] };
  for (var key in obj) fn(obj, newObj, key);
  return newObj;
};
var concatArrays = function(array, host) {
  for (var n = 0, l = array.length; n < l; n++) host[host.length] = array[n];
  return host;
};

var Schnauzer = function(template, options) {
  this.version = '1.5.0';
  this.partials = {};
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
    helpers: {},
    partials: {},
    self: 'self',
    nameCharacters: '',
    escapeHTML: true,
    renderHook: null,
  };
  initSchnauzer(this, options || {}, template);
};

var initSchnauzer = function(_this, options, template) {
  for (var option in options) _this.options[option] = options[option];
  options = _this.options;
  switchTags(_this, options.tags);
  _this.entityRegExp =
    new RegExp('[' + getObjectKeys(options.entityMap).join('') + ']', 'g');
  _this.helpers = options.helpers;
  for (var name in options.partials)
    _this.registerPartial(name, options.partials[name]);
  if (template) _this.parse(template);
};

Schnauzer.prototype = {
  render: function(data, extra) {
    return this.partials[this.options.self](getScope(data, extra || {}));
  },
  parse: function(text) {
    return this.registerPartial(this.options.self, text);
  },
  registerHelper: function(name, helperFn) {
    this.helpers[name] = helperFn;
  },
  unregisterHelper: function(name) {
    delete this.helpers[name];
  },
  registerPartial: function(name, text) {
    return this.partials[name] = this.partials[name] ||
      (text.constructor === Function ? text : sizzleBlocks(this, text, []));
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
  var tgs = tags[0] === '{{' ? ['({{2,3}~*)', '(~*}{2,3})'] : tags;
  var chars = _this.options.nameCharacters + '!-;=?@[-`|';
  var blockEnd = (tgs[0] + '\\/\\3' + tgs[1]).replace(/[()]/g, '');

  _this.inlineRegExp = new RegExp(tgs[0] + '([>!&=])*\\s*([\\w\\' +
    chars + '<>|\\.\\s]*)' + tgs[1], 'g');
  _this.sectionRegExp = new RegExp(tgs[0] + '([#^][*%]*)\\s*([\\w' +
    chars + '~]*)(?:\\s+([\\w$\\s|.\\/' + chars + ']*))*' + tgs[1] +
    '(?:\\n*)((?:(?!' + tgs[0] + '[#])[\\S\\s])*?)(' + blockEnd + ')', 'g');
  _this.elseSplitter = new RegExp(tgs[0] + '(?:else|\\^)\\s*(.*?)' + tgs[1]);
}

// ---- render data helpers

function escapeHtml(string, _this, doEscape) {
  return doEscape && _this.options.escapeHTML ?
    String(string).replace(_this.entityRegExp, function(char) {
      return _this.options.entityMap[char];
    }) : string;
}

function createHelper(idx, key, len, value, parent) {
  return {
    '@index': idx,
    '@last': idx === len - 1,
    '@first': idx === 0,
    '@length': len,
    '@parent': parent,
    '@key': key,
    'this': value,
    '.': value,
  };
}

function shiftScope(scopes, data, helpers, level, replace) {
  data = { scope: data, helpers: helpers, level: level };
  return replace ? (scopes[0] = data, scopes) : concatArrays(scopes, [data]);
}

function getScope(data, extra) {
  return {
    extra: extra,
    scopes: [{ scope: data, helpers: {}, level: { '@root': data } }],
  };
}

function getDeepData(data, mainVar, getParent) {
  for (var n = 0, l = mainVar.path.length; n < l; n++) {
    data = data[mainVar.path[n]];
    if (!data) return;
  }
  return getParent ? data : data[mainVar.value];
}

function getHelperData(_this, model, root) {
  var key = root.variable.root;
  var data = { key: key, value: _this.helpers[key], type: 'helper' };

  return  getValue(_this, data, model, { vars: root.variable.vars }, null);
}

function getData(_this, model, tagData) {
  var root = tagData.root;
  var variable =  root.variable;
  var scope = model.scopes && model.scopes[variable.parentDepth] || {};
  var scopeData = scope.scope || {};
  var key = variable.value;
  var helper = !root.isStrict && !root.isString && _this.helpers[key] || null;
  var partial = tagData.isPartial && _this.partials[key] || null;
  var tmp = '';
  var value = variable.root ? getHelperData(_this, model, root) :
    (root.isString && variable.name) || variable.isLiteral ? key :
    (tmp = getDeepData(scope.level || {}, variable)) !== undefined ? tmp :
    (tmp = getDeepData(scope.helpers || {}, variable)) !== undefined ? tmp :
    (tmp = getDeepData(scopeData, variable)) !== undefined ? tmp :
    helper || partial || (scopeData[key] !== undefined ? scopeData[key] :
    root.isString ? key : getDeepData(model.extra, variable));
  var type = value === undefined || value === null ? '' : helper ? 'helper' :
    partial ? 'partial' : value.constructor === Array ? 'array' : typeof value;

  return { value: value, type: type };
}

function getValue(_this, data, model, tagData, bodyFn) {
  return data.type === 'helper' || data.type === 'function' ?
    renderHelper(_this, data, model, tagData, [{bodyFn: bodyFn}]) : data.value;
}

function collectValues(_this, data, model, vars, obj, arr, restore) {
  for (var n = vars.length, item = {}, key = '', scp = null, iVar = ''; n--; ) {
    item = vars[n];
    iVar = item.variable;
    scp = !!iVar.root ? getValue(_this, data, model, iVar, null) : null;
    key = scp || !iVar.name ? ('$' + n) : iVar.name;
    if (iVar.name) restore[key] = obj[key];
    obj[key] = scp || getData(_this, model, { root: item }).value;
    arr.push(obj[key]);
    if (item.isAlias) model.scopes[0].level[key] = obj[key];
  }
  return { obj: obj, arr: arr, restore: restore };
}

function pushAlias(tagData, variable, obj, key, value) {
  if (tagData.root.isAlias) {
    obj[variable.name || variable.value] = value;
    if (key !== undefined) obj[tagData.root.aliasKey || '@key'] = key;
  }
  return obj;
}

// ---- render blocks/inlines helpers (std. HBS helpers)

function renderPartial(_this, data, model, tagData) {
  var helpers = model.scopes[0].helpers;
  var restore = collectValues(_this, data, model, tagData.vars, helpers,[],{});

  return [data.value(model), cloneObject(restore.restore, helpers)][0];
}

function renderHelper(_this, data, model, tagData, bodyFns) {
  return data.value.apply({
    name: tagData.root ? tagData.root.variable.value : '',
    scope: model.scopes[0].scope,
    rootScope: model.scopes[model.scopes.length - 1].scope,
    getBody: function() {
      return bodyFns[0] ? bodyFns[0].bodyFn(model) : '';
    },
    getData: function(key) {
      return getData(_this, model, { root: getVar(key) }).value;
    },
    escape: function(string) { return escapeHtml(string, _this, true) },
  }, collectValues(_this, data, model, tagData.vars, {}, [], {}).arr);
}

function renderIfUnless(_this, data, model, tagData, bodyFns, track) {
  var idx = 0;
  var item = bodyFns[idx];
  var cond = !tagData.helper || tagData.helper === 'if' ? true : false;
  var result = false;
  var value = getValue(_this, data, model, tagData, item.bodyFn);

  while (!(result = cond && !!value || !cond && !value) && bodyFns[idx + 1]) {
    item = bodyFns[++idx];
    cond = !item.helper || item.helper === 'if' ? true : false;
    data = item.root ? getData(_this, model, item) : { value: cond };
    value = getValue(_this, data, model, item, item.bodyFn);
  }
  track.fnIdx = idx;
  return result ? item.bodyFn(model) : '';
}

function renderEach(_this, data, model, tagData, bodyFns) {
  var out = '';
  var isArr = data.type === 'array';
  var _data = isArr ? data.value || [] : getObjectKeys(data.value || {});

  for (var n = 0, l = _data.length, key = ''; n < l; n++) {
    key = isArr ? n : _data[n];
    model.scopes = shiftScope(
      model.scopes,
      data.value[key],
      createHelper(n, key, l, isArr ? _data[n] : data.value[key], data.value),
      pushAlias(tagData, tagData.root.variable, {}, key, data.value[key]),
      !!n
    );
    out += bodyFns[0].bodyFn(model);
  }
  model.scopes.shift();
  return out;
}

function renderWith(_this, data, model, tagData, bodyFns) {
  var variable = tagData.root.variable;
  var scope0 = model.scopes[0];
  var level = cloneObject({'.': data.value, 'this': data.value}, scope0.level);

  model.scopes = shiftScope(model.scopes, data.value, {
    '@parent': getDeepData(model.scopes[variable.parentDepth], variable, true),
  }, pushAlias(tagData, variable, level, undefined, data.value), false);
  return [bodyFns[0].bodyFn(model), model.scopes.shift()][0];
}

// ---- render blocks and inlines; delegations only

function render(_this, model, tagData, isBlock, out, renderFn, bodyFns, track) {
  return _this.options.renderHook ? _this.options.renderHook.call(
    _this, out, tagData, model, isBlock, track,
    tagData.root ? tagData.root.variable.value : '', model.scopes[0] &&
    (model.scopes[0].level['@parent'] || model.scopes[0].scope) || {},
    function() { return renderFn(_this, tagData, model,
      bodyFns || getData(_this, model, tagData), track)
    }) : out;
}

function renderInline(_this, tagData, model, data) {
  return data.value === undefined ? '' : tagData.isPartial ?
    renderPartial(_this, data, model, tagData) :
    escapeHtml(data.type === 'helper' || data.type === 'function' ?
      renderHelper(_this, data, model, tagData, []) : data.value,
    _this, data.type !== 'boolean' &&  data.type !== 'number' &&
    tagData.isEscaped);
}

function renderInlines(_this, tags, glues, blocks, model) {
  for (var n = 0, l = glues.length, out = ''; n < l; n++) {
    out += glues[n];
    if (!tags[n]) continue;
    out += tags[n].blockIndex > -1 ? blocks[tags[n].blockIndex](model) :
    render(_this, model, tags[n], false,
      renderInline(_this, tags[n], model, getData(_this, model, tags[n])),
    renderInline, null);
  }
  return out;
}

function renderBlock(_this, tagData, model, bodyFns, recursive) {
  var data = getData(_this, model, tagData);
  var helper = tagData.helper;
  var isIfUnless = helper === 'if' || helper === 'unless';
  var track = recursive || { fnIdx: 0 }; // track ifElese bodyFn
  var renderFn = data.type === 'helper' || data.type === 'function' && !helper ?
    renderHelper : isIfUnless || data.value === undefined ?
    renderIfUnless : helper === 'with' || !helper && data.type !== 'array' ?
    renderWith :
    renderEach;
  var value = renderFn(_this, data, model, tagData, bodyFns, track);

  return recursive ? value :
    render(_this, model, tagData, true, value, renderBlock, bodyFns, track);
}

// ---- parse (pre-render) helpers

function trim(text, start, end) {
  var regExp = !start && !end ? '' :
    !start ? '\\s*$' : !end ? '^\\s*' : '^\\s*|\\s*$';

  return regExp ? text.replace(new RegExp(regExp, 'g'), '') : text;
}

function getTrims(start, end) {
  return [ start.indexOf('~') !== -1, end.indexOf('~') !== -1 ];
}

function convertValue(text, obj) {
  if (text.charAt(0) === '"' || text.charAt(0) === "'") {
    obj.isString = true;
    return text.substr(1, text.length - 2);
  }
  if (/\.|\|/.test(text)) obj.isStrict = true;
  return text === 'true' ? true : text === 'false' ?
    false : isNaN(text) || text === '' ? text : +text;
}

function cleanText(text, obj) {
  return text.replace(/^(?:this[/.]|\.\/)/, function($) {
    if ($) obj.isStrict = true;
    return '';
  }).replace(/[[\]]/g, '');
}

function getActiveState(text) {
  return text.charAt(1) === '%' ? 2 : text.charAt(0) === '%' ? 1 : 0;
}

function splitVars(text, out) {
  if (!text) return out;
  text.replace(/\(.*?\)|(?:("|'|\|).*?\1)|\S+/g, function(match) {
    if (match) out.push(match);
  });
  return out;
}

function parsePath(text, name, string) {
  var isString = typeof text === 'string';
  var isDot = text === '.';
  var doOperate = isString && !isDot && !string;
  var parts = doOperate ? text.split('../') : [];
  var pathParts = doOperate ? parts.pop().split(/[.\/]/) : [text];

  if (parts[0] === '@') { // HBS transform
    pathParts[parts.length - 1] = parts[0] + pathParts[parts.length - 1];
  }
  return !isString ? { name: name, value: text, isLiteral: true, path: [] } : {
    name: name,
    value: pathParts.pop(),
    path: pathParts,
    parentDepth: parts.length,
  }
}

function getVar(item) {
  var split = [];
  var out = {
    variable: {},
    isAlias: false,
    aliasKey: '',
    isString: false,
    isStrict: false,
    active: 0,
  };

  item = cleanText(item, out).substr(out.active = getActiveState(item));
  if (item.charAt(0) === '(') {
    item = item.substr(1, item.length - 2);
    split = splitVars(item, []);
    return { variable: {
      root: split.shift(), vars: processVars(split, [], {}), path: []
    }};
  }
  split = item.split('='); // /([=!<>]+)/
  out.variable = split[1] ?
    parsePath(convertValue(split[1], out), split[0], out.isString) :
    parsePath(convertValue(split[0], out), '', out.isString);
  return out;
}

function processAlias(out, text) {
  var parts = text.replace(/\s*\|\s*/g, '').split(/\s+/);

  out.variable.name = parts[0];
  out.aliasKey = parts[1] || '';
  out.isAlias = true;
}

function processVars(vars, collection, root) {
  for (var n = 0, l = vars.length, out = root || {}; n < l; n++) {
    if (vars[n] === 'as') {
      processAlias(out, vars[++n]);
      continue;
    }
    out = getVar(vars[n]);
    collection.push(out);
  }
  return collection;
}

function getTagData(_this, root, vars, type, start, bodyFn) {
  var varsArr = splitVars(root + (vars ? ' ' + vars : ''), []);
  var _root = varsArr.shift() || '';
  var helper = /^(?:if|each|with|unless)$/.test(_root) ? _root : '';
  var active = getActiveState(_root = helper ? varsArr.shift() || '' : _root);

  return bodyFn && !_root ? { bodyFn: bodyFn } : {
    root: _root = getVar(_root.substr(active)),
    isPartial: type === '>',
    isEscaped: start.lastIndexOf(_this.options.tags[0]) < 1,
    helper: type === '^' ? 'unless' : helper,
    vars: processVars(varsArr, [], _root),
    active: active,
    bodyFn: bodyFn || null,
  };
}

// ---- sizzle inlines

function sizzleInlines(_this, text, blocks, tags, glues) {
  var parts = text.split(_this.inlineRegExp);

  for (var n = 0, l = parts.length, vars = '', trims = []; n < l; n += 5) {
    if (parts[2 + n] && /^(?:!|=)/.test(parts[2 + n])) continue;
    vars = parts[3 + n] || '';
    trims = getTrims(!n ? '' : parts[4 + n - 5], !vars ? '' : parts[1 + n]);
    glues.push(trim(parts[n], trims[0], trims[1]));
    vars && tags.push(vars.indexOf('-block-') !== -1 ?
      { blockIndex: +vars.substr(8) } :
      getTagData(_this, vars, '', parts[2 + n] || '', parts[1 + n], null));
  }
  return function executeInlines(data) {
    return renderInlines(_this, tags, glues, blocks, data);
  }
}

// ---- sizzle blocks

function processBodyParts(_this, parts, blocks, mainStart, blkTrims, bodyFns) {
  for (var n = 0, l = parts.length, prev = false, trims = []; n < l; n += 4) {
    prev = trims[1] !== undefined ? trims[1] : blkTrims[0];
    trims = parts[1 + n] ? getTrims(parts[1 + n], parts[3 + n]) : [blkTrims[1]];
    bodyFns.push(getTagData(_this, parts[2 + n - 4] || '', '', '',
      n !== 0 ? parts[1 + n - 4] || '' : mainStart,
      sizzleInlines(_this, trim(parts[n], prev, trims[0]), blocks, [], [])));
  }
  return bodyFns;
}

function doBlock(_this, blocks, start, end, close, body, type, root, vars) {
  var closeParts = close.split(root);
  var tagData = getTagData(_this, root, vars, type || '', start, null);
  var bodyFns = processBodyParts(_this, body.split(_this.elseSplitter),
    blocks, start, getTrims(end, closeParts[0]), []);

  blocks.push(function executeBlock(model) {
    return renderBlock(_this, tagData, model, bodyFns);
  });
  return (start + '-block- ' + (blocks.length - 1) + closeParts[1]);
}

function sizzleBlocks(_this, text, blocks) {
  var replaceCb = function($, start, type, root, vars, end, body, $$, close) {
    return type === '#*' ? _this.registerPartial(vars.replace(/['"]/g, ''),
        sizzleBlocks(_this, body, blocks)) && '' :
      doBlock(_this, blocks, start, end, close, body, type, root, vars);
  };

  while (text !== (text = text.replace(_this.sectionRegExp, replaceCb)));
  return sizzleInlines(_this, text, blocks, [], []);
}

}));
