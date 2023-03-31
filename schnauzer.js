/**! @license schnauzer v2.0.8; Copyright (C) 2017-2023 by Peter Dematté */
(function(global, factory) {
  if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();
  else if (typeof define === 'function' && define.amd)
    define([], function() { return factory(); }, 'schnauzer');
  else if (typeof exports === 'object') exports['Schnauzer'] = factory();
  else global.Schnauzer = factory();
}(this && this.window || global, function factory() { 'use strict';

var getObjectKeys = Object.keys || function(obj) {
  var keys = [], prop = '';
  for (prop in obj) if (hasOwnProperty.call(obj, prop)) keys.push(prop);
  return keys;
};
var cloneObjectFn = function(obj, newObj, key) { newObj[key] = obj[key] };
var cloneObject = function(newObj, obj) {
  for (var key in obj) cloneObjectFn(obj, newObj, key);
  return newObj;
};
var concatArrays = function(array, host) { return host.push.apply(host, array), host };
var trims = { start: /^\s*/, all: /^\s*|\s*$/g, end: /\s*$/ };

var Schnauzer = function(templateOrOptions, options) {
  this.version = '2.0.8';
  this.partials = {};
  this.helpers = {};
  this.regexps = {};
  this.controls = { active: false, stop: false, loop: [] };
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
    escapeHTML: true,
    limitPartialScope: true, // HBS style; new in v1.6.5
    loopHelper: null,
    renderHook: null,
  };
  initSchnauzer(this, options || {}, templateOrOptions);
};

var initSchnauzer = function(_this, options, template) {
  if (typeof template !== 'string') { options = template; template = '' }
  options = cloneObject(_this.options, options);
  switchTags(_this, options.tags);
  _this.helpers = options.helpers;
  _this.registerPartial(options.partials);
  if (template !== undefined) _this.parse(template);
  delete options.helpers; delete options.partials;
};

var HBSS = Schnauzer.SafeString = function(text) { this.string = text }; // WTF
HBSS.prototype.toString = HBSS.prototype.toHTML = function() { return '' + this.string };
Schnauzer.getObjectKeys = getObjectKeys; Schnauzer.cloneObject = cloneObject;
Schnauzer.concatArrays = concatArrays;

Schnauzer.prototype = {
  render: function(data, extra) {
    var helpers = createHelper(this, '', '', 0, data, null, [{ scope: data }]);
    return [this.partials[this.options.self]({ blocks: {},
      extra: extra, scopes: [{ scope: data, helpers: helpers, level: [], values: null, alias: {} }],
    }), this.controls.active = true][0];
  },
  parse: function(txt) { return this.registerPartial(this.options.self, txt) },
  registerHelper: function(name, helperFn) {
    if (typeof name === 'string') return this.helpers[name] = helperFn;
    for (var key in name) this.helpers[key] = name[key];
  },
  unregisterHelper: function(name) { delete this.helpers[name] },
  registerPartial: function(name, txt) {
    if (typeof name === 'string') return this.partials[name] =
      this.partials[name] || (txt.constructor === Function ? txt : parseTags(this, txt, []));
    for (var key in name) this.registerPartial(key, name[key]);
  },
  unregisterPartial: function(name) { delete this.partials[name] },
  setTags: function(tags) { switchTags(this, tags) },
  escapeExpression: function(txt) { return escapeHtml(this, txt, true) },
};

return Schnauzer;

function switchTags(_this, tags) {
  var tgs = (function(tags) { for (var n = tags.length; n--; ) {
    tags[n] = '(' + tags[n] + ')';
  } return tags; })(tags[0] === '{{' ? ['{{2,3}', '[~}]{2,4}'] : tags);

  _this.regexps = {
    tags: new RegExp(tgs[0] + '([#~^/!>*-]*)\\s*([^~}]*)' + tgs[1]),
    entity: new RegExp('[' + getObjectKeys(_this.options.entityMap).join('') + ']', 'g')
  };
}

// ---- render data helpers

function escapeHtml(_this, string, doEscape) {
  return string == null ? '' : string.constructor === Schnauzer.SafeString ? string.string :
    doEscape && _this.options.escapeHTML ? String(string).replace(
      _this.regexps.entity, function(char) { return _this.options.entityMap[char] }
    ) : string;
}

function createHelper(_this, idx, key, len, value, parent, scopes) {
  return len ? {
    '@index': idx,
    '@number': idx + 1,
    '@key': key,
    '@odd': idx % 2 !== 0,
    '@last': idx === len - 1,
    '@first': idx === 0,
    '@length': len,
    '@depth': _this.options.limitPartialScope ? undefined : scopes.length - 2,
    '@loop': parent,
    '@parent': scopes[1].scope,
    '@root': scopes[scopes.length - 1].scope,
    'this': value,
    '.': value,
  } : { '@parent': parent, '@root': scopes[scopes.length - 1].scope, 'this': value, '.': value };
}

function addScope(model, data, alias) {
  var scopes = model.scopes;
  var newLevel = model.alias ? [model.alias] : [];
  var level = concatArrays(scopes[0].level, newLevel);
  var values = model.values;
  var prevAlias = scopes[1] ? cloneObject({}, scopes[1].alias) : {};

  model.alias = null; model.values = null;
  alias = alias ? cloneObject(prevAlias, alias) : prevAlias;
  model.scopes = concatArrays(scopes, [{
    scope: data, helpers: scopes[0].helpers, level: level, values: values, alias: alias,
  }]);
  return function() { model.scopes = scopes };
}

function tweakScope(scope, data) {
  var savedScope = scope.scope;
  scope.scope = data || {};
  return function() { scope.scope = savedScope; };
}

function getDeepData(data, main, alias) {
  if (main.value === '.' || main.value === 'this') return { value: data, variable: main };
  if (main.type !== 'key') return { value: main.value, variable: main };
  for (var n = main.path[0] === '@root' ? 1 : 0, l = main.path.length; n < l; n++)
    if (!(data = data[main.path[n]])) return { variable: main };
  return { value: data[main.value], parent: data, variable: main, alias: alias || false };
}

function getAlias(level, main, scope, data) {
  for (var n = 0, l = level.length; n < l; n++) {
    data = getDeepData(level[n], main, true);
    if (data.value !== undefined) {
      if (scope = scope.alias[data.variable.value]) {
        data.parent = scope.parent;
        data.key = scope.key;
      }
      return data;
    }
  }
  return { variable: main };
}

function createAliasMap(key, scope, model, aliasKey, data) {
  if (data.value === undefined || aliasKey === undefined) return;
  if (!model[key]) model[key] = {};
  model[key][aliasKey] = data.value;
  if (scope) scope.alias[aliasKey] = { parent: data.parent, key: data.variable.value };
}

function getData(_this, model, tagData, out) {
  var vars = tagData.vars;
  var trackData = !!_this.options.renderHook;

  if (!vars) return out;

  for (var n = 0, l = vars.length, help, main = {}, scope = {}, data = {}, args = []; n < l; n++) {
    main = vars[n];
    scope = !main.path || main.path[0] !== '@root' ? model.scopes[main.depth || 0] :
      model.scopes[model.scopes.length - 1];
    if (!scope) { out.push(data); continue; }
    data = { value: scope.helpers[main.value], variable: main,
      parent: help = (main.value + '').charAt(0) === '@' ? scope.helpers : scope.scope };

    if (data.value === undefined && scope.values) data = getAlias([scope.values], main, scope, data);
    if (data.value === undefined && !main.isStrict) data = getAlias(scope.level, main, scope, data);
    if (data.value === undefined) data = !main.helper ? getDeepData(scope.scope, main) :
      { value: renderHelper(_this, args = getData(_this, model, main, []), model, main) };
    if (data.value === undefined && model.extra) data = getDeepData(model.extra, main);
    if (data.value === undefined && help) data.parent = scope.helpers;

    if (main.alias) createAliasMap('alias', trackData && scope, model, main.alias[0], data);
    if (main.name) createAliasMap('values', trackData && scope, model, main.name, data);

    data.type = data.value && data.value.constructor === Array ? 'array' : typeof data.value;
    if (!data.variable) data.variable = main; // nested helper functions don't
    if (trackData && main.helper) data.renderArgs = args;
    if (trackData && _this.controls.loop[0]) data.loop = _this.controls.loop[0];
    out.push(data);
  }
  if (trackData && tagData.helper && !tagData.tag) tagData.renderFn =
    function(newData) { return renderHelper(_this, newData, model, tagData) };
  return out;
}

function checkObjectLength(main, helper, objKeys) {
  var value = main.value;
  var isObject = main.type === 'object';
  var go = helper === 'each' || helper === 'with' || (main.type === 'array' &&
    (helper === 'if' || helper === 'unless'));

  if (!go || value === undefined) return value;
  if (isObject) objKeys.keys = getObjectKeys(value);
  return isObject ? objKeys.keys.length && value : value.length && value;
}

function getHelperArgs(_this, model, tagData, data, newData, track) {
  var save = null;
  var name = tagData.helper ? tagData.helper.orig : '';
  var helpers = model.scopes[0].helpers;
  var children = tagData.children;
  var args = {
    name: name,
    hash: {},
    data: { root: helpers['@root'], scope: helpers['this'], parent: helpers['@parent'] },
    escapeExpression: function(txt) { return _this.escapeExpression(txt) },
    SafeString: Schnauzer.SafeString,
    keys: getObjectKeys,
    extend: cloneObject,
    concat: concatArrays,
    getDataDetails: function() { return data },
  };

  if (helpers['@length']) cloneObject(args.data, { loop: helpers['@loop'], depth: helpers['@depth'],
    index: helpers['@index'], number: helpers['@number'], length: helpers['@length'],
    first: helpers['@first'], last: helpers['@last'], key: helpers['@key'], odd: helpers['@odd']
  });
  for (var n = data.length; n--; ) {
    if (data[n].variable.name) args.hash[data[n].variable.name] = data[n].value;
    else newData.unshift(data[n].value);
  }
  if (children) {
    args.fn = function(context) {
      track.fnIdx = 0; if (track.checkFn) track.checkFn(0);
      save = tweakScope(model.scopes[0], context);
      return [ children[0].text + children[0].bodyFn(model), save() ][0];
    };
    args.inverse = children[1] && function(context) {
      track.fnIdx = 1; if (track.checkFn) track.checkFn(1);
      save = tweakScope(model.scopes[0], context);
      return [ children[1].text + children[1].bodyFn(model), save() ][0];
    } || function noop() { return '' };
  }
  return args;
}

function getHelperFn(_this, model, tagData) {
  var scope = model.scopes[tagData.helper.depth || 0].scope;
  var helperFn = _this.helpers[tagData.helper.orig];

  return tagData.helperFn || (tagData.helper.isStrict || !helperFn ?
    getDeepData(scope, tagData.helper).value : helperFn);
}

// ---- render blocks/inlines helpers (std. HBS helpers)

function renderHelper(_this, data, model, tagData, track) {
  var helperFn = !tagData.helper && tagData.children &&
    (data[0] ? renderConditions : undefined) || tagData.helperFn;
  var newData = [];
  var out = '';
  var restore = model.scopes[0].values;

  if (helperFn) return helperFn(_this, data, model, tagData, track);
  helperFn = getHelperFn(_this, model, tagData);
  if (!helperFn && data.length === 1 && data[0].type === 'function') helperFn = data.shift().value;
  if (model.values) model.scopes[0].values = model.values;

  if (data.length) newData.push(getHelperArgs(_this, model, tagData, data, newData, track));
  out = helperFn ? helperFn.apply(model.scopes[0].scope, newData) : '';
  model.scopes[0].values = restore;
  return out === undefined ? '' : out;
}

function renderPartial(_this, data, model, tagData) {
  var newData = tagData.partial.vars && getData(_this, model, tagData.partial, []);
  var helperValue = tagData.partial.helper && renderHelper(_this, newData, model, tagData.partial);
  var name = tagData.partial.orig || newData && (helperValue || newData[0].value) || '';
  var isTemplate = name === '@partial-block';
  var isBlock = !isTemplate && name.charAt(0) === '@';
  var partial = _this.partials[isBlock ? name.substring(1) : name] || (model.extra && model.extra[name]);
  var scope = data[0] && !data[0].variable.name ? data[0].value : model.scopes[0].scope;
  var reset = addScope(model, scope, model.scopes[0].alias);

  model.scopes[0].level = [];
  if (!partial && isBlock) partial = _this.partials[name];
  if (isBlock) model.blocks[name] = _this.partials[name];
    else if (isTemplate) partial = model.blocks[name];
  if (_this.options.limitPartialScope) model.scopes = [model.scopes[0]];
    else model.scopes.splice(1, 1);
  return [ partial ? partial(model) : '', reset() ][0];
}

function renderConditions(_this, data, model, tagData, track) {
  var idx = 0;
  var objKeys = { keys: [] };
  var children = tagData.children;
  var tag = children[idx];
  var helper = tagData.helper;
  var cond = helper === 'if' || helper === 'each' || helper === 'with';
  var isVarOnly = !helper && data.length === 1;
  var main = data[0] || {};
  var value = checkObjectLength(main, helper, objKeys);
  var canGo = ((cond || isVarOnly) && value) || (helper === 'unless' && !value);
  var reset = null;

  while (children[idx + 1] && !canGo) {
    tag = children[++idx];
    helper = tag.helper;
    cond = helper === 'if' || helper === 'each' || helper === 'with';
    data = tag.vars.length ? getData(_this, model, tag, []) : [];
    isVarOnly = !helper && data.length === 1;
    main = data[0] || {};
    value = checkObjectLength(main, helper, objKeys);
    canGo = ((cond || isVarOnly) && value) || (helper === 'unless' && !value) ||
      (!helper && !data.length && tag.bodyFn); // isElse
  }
  track.fnIdx = canGo ? idx : idx + 1; // speeds up API calls
  track.checkFn && track.checkFn(idx);
  if (isVarOnly && main.type === 'array') helper = 'each';
  if (_this.controls.stop && typeof _this.controls.stop !== 'string' && helper === 'each') return '';
  if (isVarOnly && !helper) helper = 'with';
  if (helper === 'with' || helper === 'each') {
    reset = addScope(model, value, helper === 'with' && model.scopes[0].alias);
    if (helper === 'each') return renderEach(_this, value, main, model,
      tag, objKeys.keys, _this.options.loopHelper, reset);
    model.scopes[0].helpers = createHelper(_this, '', '', 0,
      isVarOnly ? value : model.scopes[0].scope, model.scopes[1].scope, model.scopes);
  }
  return [canGo ? tag.text + tag.bodyFn(model) : '', reset && reset()][0];
}

function renderEach(_this, data, main, model, tagData, objKeys, loopHelper, reset) {
  var bodyFn = tagData.bodyFn;
  var scope = model.scopes[0];
  var alias = main.variable.alias;
  var level = scope.level[0];
  var isArr = main.type === 'array';
  var value = !isArr && main.type !== 'object' ? [] : isArr ? data : objKeys;
  var currentScopes = model.scopes; // loopHelper ? concatArrays([], model.scopes) : null;
  var loopFn = loopHelper && function(newData, key) { // main.variable.active && 
    model.scopes = currentScopes;
    model.scopes[0].scope = newData;
    model.scopes[0].helpers =
      createHelper(_this, key, key, main.value.length, newData, data, model.scopes);
    _this.controls.loop.unshift(scope.helpers);
    return [loopHelper(_this, tagData.text + bodyFn(model), main, +key, loopFn, true),
      _this.controls.loop.shift()][0];
  };

  if (alias && loopHelper) scope.alias[alias[0]] = { parent: data };
  if (_this.controls.stop) return ['', loopHelper(_this, loopFn, main), reset()][0];
  if (loopHelper) _this.controls.loop.unshift(null);
  for (var n = 0, l = value.length, key = '', out = ''; n < l; n++) {
    key = (isArr ? n : value[n]);
    scope.helpers = createHelper(_this, n, key, l, data[key], data, model.scopes);
    scope.scope = data[key];
    if (alias) {
      if (alias[1]) level[alias[1]] = key;
      level[alias[0]] = data[key];
      if (loopHelper) scope.alias[alias[0]].key = key;
    }
    if (loopHelper) _this.controls.loop[0] = scope.helpers;
    out += loopFn ? loopHelper(_this, (loopHelper(_this, key, main),
      tagData.text + bodyFn(model)), main, n, loopFn) : tagData.text + bodyFn(model);
  }
  return [ out, reset(), loopHelper && _this.controls.loop.shift() ][0];
}

// ---- render blocks and inlines; delegations only

function render(_this, model, data, tagData, out, renderFn, track) {
  model.values = null;
  if (_this.options.renderHook && tagData.tag === 'B') model =
    { extra: model.extra, scopes: model.scopes, alias: model.alias, blocks: model.blocks };
  return !_this.options.renderHook || !data.length || _this.controls.active ? out :
    _this.options.renderHook(_this, out, data, function recallBodyFn(newModel, helpers, stop) {
      if (helpers) model.scopes[0].helpers = helpers; // model.scopes[newModel.variable.depth]?
      if (newModel[0].parent) model.scopes[0].scope = newModel[0].parent; // dus wel
      if (stop) _this.controls.stop = stop;
      return [renderFn(_this, tagData, newModel, model, track || { fnIdx: 0 }),
        _this.controls.stop = false, _this.controls.active = true][0];
    }, tagData, tagData.tag === 'B' ? track || { fnIdx: 0 } : undefined,
    tagData.children && tagData.children[1] && tagData.children[1].tag === 'E' ?
      function(tag) { return getData(_this, model, tag, []) } : null);
}

function renderInline(_this, tagData, data, model) {
  var type = data[0] && data[0].type;
  var out = tagData.partial ? renderPartial(_this, data, model, tagData) :
    escapeHtml(_this, tagData.helper || type === 'function' ?
      renderHelper(_this, data, model, tagData) : data[0] && data[0].value,
      type !== 'boolean' && type !== 'number' && tagData.isEscaped);

  return render(_this, model, data, tagData, out, renderInline, null);
}

function renderInlines(_this, tags, model) {
  for (var n = 0, l = tags.length, out = ''; n < l; n++) out += (tags[n].tag === 'B' ? renderBlock :
    renderInline)(_this, tags[n], getData(_this, model, tags[n], []), model) + tags[n].text;
  return out;
}

function renderBlock(_this, tagData, data, model, recursive) {
  var track = recursive || { fnIdx: 0 };
  var out = renderHelper(_this, data, model, tagData, track);

  return recursive ? out : render(_this, model, data, tagData, out, renderBlock, track);
}

// ---- parse (pre-render) helpers

function trim(text, start, end) {
  var doStart = start.indexOf('~') !== -1;
  var doEnd = end.indexOf('~') !== -1;
  var regExp = !doStart && !doEnd ? '' : !doStart ? trims.end : !doEnd ? trims.start : trims.all;

  return regExp ? text.replace(regExp, '') : text;
}

function convertValue(text, skip) {
  return skip ? text : text === 'true' ? true : text === 'false' ?
    false : isNaN(text) || text === '' ? text : +text;
}

function cleanText(text, out) {
  return text.replace(/^(?:this[/.]|\.\/|\|)/, function($) {
    if ($) out.isStrict = true;
    return '';
  });
}

function parsePath(text, data, skip) {
  var hasDot = false;
  var name = text.replace(/@parent[/.]/, '../').replace(/\[.*?]/g, function($) { // HB
    return $.substring(1, $.length - 1).replace(/\./g, function() { hasDot = true; return '^'; });
  });
  var parts = skip ? [] : name.split('../');
  var start = parts[1] ? parts[0] : '';
  var depth = parts.length - 1;
  var value = skip ? name : parts[depth];

  if (skip || value === '.' || value === 'this' || +value == value) return {
    value: value, path: [], depth: depth, type: 'key'
  };
  parts = cleanText(value, data).split(/[./]/);
  if (hasDot) {
    for (var n = parts.length; n--; ) parts[n] = parts[n].replace(/\^/g, '.');
    name = name.replace(/\^/g, '.');
  }
  return { value: start + parts.pop(), path: parts, depth: depth, orig: name };
}

function parseAlias(value, out, spread) {
  for (var n = value.length, alias = []; n--; ) alias.unshift(value[n].value);
  if (spread) {
    while (alias.length) out[out.length - alias.length].name = alias.shift();
  } else {
    out[out.length - 1].alias = alias;
  }
}

function getVars(text, collection, out, type) {
  var txtParts = type === 'string' ? [text] : text.split(/[,;]*\s+[,;]*/);
  var isAliasOrString = type === 'alias' || type === 'string';

  for (var n = 0, l = txtParts.length, match = /--(\d+)--/, replace = /%+/, dataType = '',
      parts = [], value = '', data = {}, paths = {}, skipConvert = false; n < l; n++) {
    if (!txtParts[n]) continue; // whitespace after
    parts = txtParts[n].split('=');
    value = parts[1] !== undefined ? parts[1] : parts[0];
    if (value === '' || value === 'as') continue;

    data = collection[(value.match(match) || [])[1]] || { value: value, type: 'key' };
    dataType = typeof data.value;
    if (dataType === 'object' && data.value[0] && data.value[0].single) return data.value;
    if (parts[1] !== undefined) data.name = parts[0];
    if (data.type === 'string') data.value = data.value[0] && data.value[0].value || '';
    else if (data.value && dataType === 'string') {
      data.value = data.value.replace(replace, function($) { data.active = $.length; return '' });
      paths = parsePath(data.value, data, isAliasOrString);
      skipConvert = isAliasOrString || (paths.orig && paths.orig !== paths.value);
      data.value = convertValue(paths.value, skipConvert);
      dataType = typeof data.value;
      if (dataType !== 'string') data.type = dataType;
      else if (paths.path && !isAliasOrString) cloneObject(data, paths);
    }
    data.type === 'alias' ? parseAlias(data.value, out, n > 3) : out.push(data);
  }
  return out;
}

function sizzleVars(text, out) {
  var replace = /\([^()]*\)/g;
  var replaceCb = function($) {
    var value = { vars: getVars($.substring(1, $.length - 1), out, [], 'fn') };
    if (value.vars.length > 1) value.helper = value.vars.shift();
    return '--' + (out.push(value) - 1) + '--';
  };

  text = text.replace(/(['"|])(?:[^\\'"]|\\+['"]|['"])*?\1/g, function($, $1) {
    var value = { type: $1 !== '|' ? 'string' : 'alias', value: '' };

    if (text.indexOf('[' + $1) !== -1 || text.indexOf($1 + '=') !== -1) return $;
    value.value = $ === text ?
      [{ value: $.substring(1, $.length - 1), path: [], depth: 0, single: true, type: 'key' }] :
      getVars($.substring(1, $.length - 1), out, [], value.type);
    return '--' + (out.push(value) - 1) + '--';
  });
  while (text !== (text = text.replace(replace, replaceCb)));
  return getVars(text, out, [], '');
}

function getTagData(_this, vars, type, start, tag, text) {
  var arr = vars ? sizzleVars(vars, []) : [];
  var helper = type === '^' ? 'unless' :
    /^(?:if|each|with|unless)$/.test((arr[0] || {}).value) ? arr.shift().value : '';

  return {
    partial: type === '>' ? arr.shift() : undefined,
    helper: helper ? helper : type !== '>' && arr.length > 1 ? arr.shift() : '',
    helperFn: helper ? renderConditions : undefined,
    isEscaped: start.lastIndexOf(_this.options.tags[0]) < 1,
    bodyFn: null,
    vars: arr,
    isInline: tag !== 'B', // new in v1.6.4 ...
    tag: tag,
    text: text,
    children: null,
  };
}

// ---- parse inline and block tags

function createExecutor(_this, tagData) {
  return tagData.bodyFn = tagData.tag === 'B' ? undefined :
    function executeInlines(model) { return renderInlines(_this, tagData.children, model); };
}

function buildTree(_this, tree, tagData, open) {
  var errorMessage = 'Schnauzer Error: Wrong closing tag: "/' + tagData.vars + '"';
  var parent = tree.parent;
  var children = [];
  var getChildren = function(tagData, isFirstChild) {
    tagData.children = children = [];
    children.parent = tree;
    tree = children;
    if (isFirstChild) {
      tree.push(getTagData(_this, '', '', open, '', tagData.text)); // TODO
      getChildren(tree[tree.length - 1]);
      tree.isElse = true;
    }
  };
  var getParent = function() {
    delete tree.parent; delete tree.isElse;
    tree = parent;
    parent = tree.parent;
    createExecutor(_this, tree[tree.length - 1]);
  };

  if (tagData.tag === 'C') {
    if (!tree.parent) throw(errorMessage);
    if (tree.isElse) getParent();
    getParent();
    if (tree.lastBlock !== tagData.vars) throw(errorMessage);
    delete tree.lastBlock;
    tree[tree.length - 1].text = tagData.text;
  } else if (tagData.tag === 'B') {
    tree.push(tagData);
    tree.lastBlock = tagData.alt || tagData.helper.value || tagData.helper || tagData.vars[0].orig;
    getChildren(tagData, true);
  } else if (tagData.tag === 'E') {
    if (tree.isElse) getParent();
    tree.push(tagData);
    getChildren(tagData);
    tree.isElse = true;
  } else { // tagData.tag === 'I'
    tree.push(tagData);
  }
  return tree;
}

function parseTags(_this, text, tree) {
  var split = text.split(_this.regexps.tags);

  tree.push({ text: split[0] });

  for (var n = 1, type = '', vars = '', body = '', space = 0, root = '', tmpRoot = [], tmpVars = [],
      testRegex = /^[!-]+/, elseRegex =/^else\s*/, types = { '#':'B','^':'B','/':'C','E':'E' },
      child = {}, cType = '', tag = '', tagData = {}, l = split.length; n < l; n += 5) {
    type = split[1 + n].replace('~', '');
    vars = split[2 + n];
    body = trim(split[4 + n], split[3 + n], split[6 + n] || '');

    if (split[n].charAt(0) === '\\' || testRegex.test(type)) continue;

    space = vars.indexOf(' ');
    root = type !== '/' && vars.substring(0, space) || vars;
    cType = type === '^' && (space !== -1 || vars === '') || root === 'else' ? 'E' : type;
    tag = types[cType.charAt(0)] || 'I';

    if (type === '#>') { tmpRoot.unshift('@' + root); tmpVars.unshift('@' + vars); }
    if (cType === 'E') vars = vars.replace(elseRegex, '');
    tagData = type === '/' ? { tag: 'C', text: body, vars: vars } :
      getTagData(_this, vars, type, split[n], tag, body);
    if (type === '^' && tag === 'B') tagData.alt = tagData.vars[0].orig;
    if (type === '#*') tagData.isPartial = true;

    tree = buildTree(_this, tree, tagData, split[n]);

    if (tag === 'C' && (tree[tree.length - 1].isPartial || tmpRoot[0])) { // Don't like this
      tagData = tree.splice(-1, 1, tmpRoot[0] ?
        getTagData(_this, tmpVars[0], '>', split[n], 'I', tagData.text) : {text: tagData.text})[0];
      child = tagData.children[0];
      child.children.unshift({ text: child.text });
      _this.registerPartial(tmpRoot[0] || tagData.vars[0].value, child.bodyFn);
      tmpRoot.shift(); tmpVars.shift();
    }
  }
  if (tree.parent) throw('Schnauzer Error: Missing closing tag(s)');
  split = text = null;

  return createExecutor(_this, { children: tree });
}

}));
