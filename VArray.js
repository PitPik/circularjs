/**! @license VArray v0.0.3; Copyright (C) 2023 by Peter Dematté */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();
  else if (typeof define === 'function' && define.amd)
    define([], function() { return factory() }, 'VArray')
  else if (typeof exports === 'object') exports['VArray'] = factory();
  else root['VArray'] = factory();
}(this && this.window || global, function() { 'use strict';

var VAProto = undefined;
var AProto = Array.prototype;
var idCounter = 0;
var NODES = {};
var getArgs = function(args, out) {
  for (var n = args.length; n--; ) out.unshift(args[n]);
  return out;
};
var createArraySubclass = function(arr, vArr, args) {
  arr.push.apply(arr, args);
  return Object.setPrototypeOf(arr, vArr.prototype); // TODO: check performance
}
var VArray = function() { return createArraySubclass([], VArray, arguments) };

VArray.prototype = Object.create(Array.prototype);
VArray.prototype.constructor = Array; // VArray;

VArray.adopt = function(data, opts) { return adopt(data, opts) };

VAProto = VArray.prototype;

// --- the 9 native mutating methods
VAProto.shift = function() { return shift(this) };
VAProto.pop = function() { return pop(this) };
VAProto.unshift = function() { return unshift(this, getArgs(arguments, [])) };
VAProto.push = function() { return push(this, getArgs(arguments, [])) };
VAProto.sort = function(fn) { return sort(this, fn) };
VAProto.reverse = function() { return reverse(this) };
VAProto.fill = function(value, start, end) { return fill(this, value, start, end) };
VAProto.copyWithin = function(target, start, end) { return copyWithin(this, target, start, end) };
VAProto.splice = function() { return splice(this, getArgs(arguments, [])) };
// ---
VAProto.move = function(item, index) { return move(this, item, index) };
VAProto.remove = function(item) { return remove(this, item) };
VAProto.replace = function(item, index) { return updateObject(this[index], item), this[index] };
// ---
VAProto.filterAll = function(fn, thisArg) { return findAll(this, fn, thisArg, []) };
VAProto.getElementById = function(id, fullId) {
  var instId = fullId ? id.substring(0, id.indexOf(':')) : '';
  var inst = NODES[instId || this[this._onChange._options.idProperty]];

  return inst ? inst[id.substring(id.indexOf(':') + 1)] : null;
};
VAProto.addSubscriber = function(property, item) { // TODO: rename;
  var path = Array.isArray(property) ? property : property.split('.');
  var data = crawlObject(item, path); // TODO: check if needed??
  if (!data.model) return;
  return setGetter(data.model, path[path.length - 1], {}, path, this._onChange._options.promoter);
};
VAProto.getCleanModel = function(item) { return JSON.parse(JSON.stringify(item)) };
VAProto.updateModel = function(newModel) { return updateModel(this, newModel) };
VAProto.destroy = function(id) { // TODO.... all
  id = typeof id !== 'object' ? id : this[this._onChange._options.idProperty].split(':')[0];
  for (var key in NODES[id]) delete NODES[id][key];
  delete NODES[id];
};

return VArray;

// ---------------------------------------

function shift(arr) {
  return remove(arr, arr[0]);
}

function pop(arr) {
  return remove(arr, arr[arr.length - 1]);
}

function unshift(arr, args) {
  for (var n = args.length; n--; ) move(arr, args[n], 0, n === 0);
  return arr.length;
}

function push(arr, args) {
  for (var n = 0, l = args.length; n < l; n++) move(arr, args[n], arr.length, n === l - 1);
  return arr.length;
}

function splice(arr, args) {
  var index = args[0] < 0 ? arr.length + args[0] : args[0];
  var count = args[1];
  var n = 0, m = 0;
  var out = [];

  for (n = 0; n < count && args[n + 2]; n++) out.push(arr.replace(args[n + 2], index + n));
  for (m = n ; m < count && arr[index + n]; m++) out.push(remove(arr, arr[index + n])); 
  if (index > arr.length) index = arr.length;
  for (n += 2; n < args.length; n++) move(arr, args[n], index + (n - 2), n >= args.length);
  return out;
}

function sort(arr, fn, order) {
  var id = arr._onChange._options.idProperty;
  var oldOrder = order || {};
  var n = 0, l = 0;
  var out;

  if (!order) for (n = arr.length; n--; ) oldOrder[arr[n][id]] = n;
  out = typeof fn === 'function' || fn === undefined ? AProto.sort.call(arr, fn) : fn;
  for (n = 0, l = arr.length; n < l; n++) arr._onChange(onChange, {
    action: 'sort',
    index: oldOrder[arr[n][id]],
    item: arr[n],
    parent: arr,
    last: n === l - 1,
  });
  return out;
}

function reverse(arr) {
  var id = arr._onChange._options.idProperty;
  var oldOrder = {};
  var n = arr.length;

  for ( ; n--; ) oldOrder[arr[n][id]] = n;
  return sort(arr, AProto.reverse.call(arr), oldOrder);
}

function fill(arr, value, start, end) {
  start = +start || 0;
  end = end === undefined ? arr.length : Math.min(+end, arr.length);
  if (start === NaN || start >= end) return arr;

  for (var n = end - start; n--; ) move(arr.getCleanModel(value), start, !!n);
  return arr;
}

function copyWithin(arr, target, start, end) {
  start = +start || 0;
  end = end === undefined ? arr.length : Math.min(+end || 0, arr.length);
  if (start === NaN || start >= end) return arr;

  for (var n = start; n < end; n++) move(arr.getCleanModel(arr[n]), target, n < end);
  return arr;
}

function move(arr, item, index, last) {
  var opts = arr._onChange._options;
  var children = opts.children;
  var isMove = item.index !== undefined;
  var prevParent = isMove ? item[children].parent : undefined;
  var movedIndex = isMove ? item.index : index;
  var root = !isMove ? getRoot(arr) : undefined;
  var splice = AProto.splice;

  splice.call(arr, index, 0, isMove ? splice.call(prevParent, movedIndex, 1)[0] : item);

  if (prevParent && prevParent !== arr) resetParents(item, arr, children);
  if (!isMove) {
    item = initChild(item, getParentIndex(arr, index, children), opts, arr.parent, root);
    if (children) item[children] = adopt(item[children] || [], opts, arr, root, index);
  }

  arr._onChange(onChange, {
    action: isMove ? 'move' : 'add',
    index: movedIndex,
    parent: arr,
    previousParent: prevParent,
    item: item,
    last: last === undefined ? true : last,
  });
}

function remove(arr, item) { // TODO: excelerate with last (array remove)
  var index = item.index;
  var deleted = AProto.splice.call(arr, index, 1);

  arr._onChange(onChange, {
    action: 'remove',
    index: index,
    parent: arr,
    item: item,
    last: true,
  });

  return deleted[0];
}

// ---------------------------------------

function onChange(apiCheck, data, opts) {
  if (apiCheck !== onChange)
    return opts.error && opts.error('VArray._onChange() only for internal use', 1);
  if (data.action === 'remove') removeCache(data.item[opts.idProperty].split(':'), opts);
  opts.promoter.onChange(data);
}

function removeCache(ids, opts) {
  var main = NODES[ids[0]];
  var children = main[ids[1]][opts.children] || []; // 'tree:', so no children
  var n = children.length;
  
  for ( ; n--; ) removeCache(children[n][opts.idProperty].split(':'), opts);
  delete main[ids[1]];
}

function getRoot(arr) {
  while (arr.parent) arr = arr.parent;
  return arr;
}

function getParentIndex(arr, start, children) {
  var alt = arr[start - 1] || arr[start + 1];
  var index = alt ? alt.parentNode && alt.parentNode.index : -1;
  var found = !alt && arr.parent ? arr.parent.find(function(item, idx) {
    if (item[children] === arr) {
      index = idx;
      return true;
    }
  }) : undefined;

  return found || alt ? index : start;
}

function resetParents(item, arr, children) { // TODO: revisit
  var parentNode = item.parentNode; // overwritten

  item[children].parent = arr;
  parentNode = arr.parent[getParentIndex(arr, item.index, children)];
  if (!parentNode) delete item.parentNode;
  else {
    if (item.parentNode !== undefined) item.parentNode = parentNode;
    else setProp(item, 'parentNode', parentNode, true, false, true);
  }
}

// ------

function crawlObject(data, keys) { // TODO: needed?
  for (var n = 0, m = keys.length, model = data; n < m; n++) {
    if (keys[n] === '*') return { model: model, value: data, path: keys };
    model = data;
    data = data && data[keys[n]];
  }
  return { model: model, value: data, path: keys };
}

function stopAt(next, parent) {
  while (next && next !== parent) next = next.parent;
  return next;
}

function findAll(arr, fn, thisArg, out) {
  var children = arr._onChange._options.children;
  var insts = NODES[arr[arr._onChange._options.idProperty].split(':')[0]];
  var all = !arr.parent;
  var item = insts;
  var key = '';

  if (thisArg) fn = fn.bind(thisArg);
  for (key in insts) {
    item = insts[key];
    if ((all || stopAt(item[children].parent, arr)) && (!fn || fn(item, key, insts))) out.push(item);
  }
  return out;
};

// ------

function updateModel(model, newModel) {
  for (var n = 0, l = model.length; n < l; n++) if (newModel[n] !== undefined) {
    updater(model, newModel, n);
  } else model.pop();

  if (newModel && l < newModel.length) {
    for (n = l, l = newModel.length; n < l; n++) {
      if (model._onChange) move(model, newModel[n], n, n === l - 1);
      else model.push(newModel[n]);
    }
  }
}

function updateObject(model, newModel) {
  for (var keys = Object.keys(model), n = 0, l = keys.length; n < l; n++)
    updater(model, newModel, keys[n]);
}

function updater(model, newModel, n) { // TODO: if (model[n].constructor === VArray) ??
  if (model[n] && Array.isArray(model[n])) updateModel(model[n], newModel[n]);
  else if (model[n] && typeof model[n] === 'object') updateObject(model[n], newModel[n]);
  else if (model[n] !== newModel[n] && newModel[n] !== undefined) model[n] = newModel[n];
}

// ---------------------------------------

function adopt(data, opts, parent, root, index) {
  var standalone = !Array.isArray(data);
  var vArr = VArray.apply(null, standalone ? [data] : data);

  setProp(vArr, '_onChange',
    root ? root._onChange : function(apiCheck, data) { onChange(apiCheck, data, opts) }, false);
  if (!root) setProp(vArr._onChange, '_options', opts, false);
  if (standalone) setProp(vArr[0], opts.idProperty, '' + idCounter++, false);
  return standalone ? initGetters(vArr[0], opts) && vArr :
    initModel(vArr, opts || {}, parent, root, index);
}

function initGetters(item, opts) {
  for (var n = opts.listeners.length, model; n--; ) {
    model = getPath(item, opts.listeners[n].split('.'), 0, 0, opts.promoter);
    if (model) setGetter(model.model, model.key, {}, model.path, opts.promoter);
  }
  return item;
}

function initModel(vArr, opts, parent, root, index) {
  if (!root) NODES[idCounter] = {};
  setProp(vArr, opts.idProperty, (root ? root[opts.idProperty] + ':' : '') + idCounter++, false);
  if (parent) setProp(vArr, 'parent', parent, true);
  for (var n = 0, l = vArr.length; n < l; n++) {
    initChild(vArr[n], index, opts, parent, root || vArr);
    if (!opts.children) continue; // in case of 'arr:'
    vArr[n][opts.children] = adopt(vArr[n][opts.children] || [], opts, vArr, root || vArr, n);
  }
  return vArr;
}

function initChild(item, index, opts, parent, root) {
  if (opts.promoter.interseptor) opts.promoter.interseptor(item, parent, root);
  NODES[root[opts.idProperty].split(':')[0]][idCounter] = item;
  setProp(item, opts.idProperty, root[opts.idProperty] + ':' + idCounter++, false);
  if (parent) setProp(item, 'parentNode', parent[index], true, false, true);
  setIndexGetter(item, opts.children, root);
  initGetters(item, opts);
  return item;
}

function setProp(model, property, value, writeable, enumable, configurable) {
  return Object.defineProperty(model, property, {
    enumerable: !!enumable,
    configurable: configurable === undefined ? false : configurable,
    writable: writeable === undefined ? true : !!writeable,
    value: value,
  });
}

function setIndexGetter(model, children, root) {
  return Object.defineProperty(model, 'index', {
    get: function() { return (model[children] && model[children].parent || root).indexOf(model) },
  });
}

function setGetter(model, property, cache, path, promoter) {
  cache[property] = model[property];

  return Object.defineProperty(model, property, {
    get: function() { return cache[property] },
    set: function(value) {
      var oldValue = cache[property];

      if (oldValue && oldValue._onChange && value !== oldValue) return updateModel(oldValue, value);

      cache[property] = value;
      if (promoter.onChange({
        action: 'change', value: value, oldValue: oldValue, path: path, item: model, key: property,
      }) === false) cache[property] = oldValue;
    }
  });
}

// ---------------------------------------

function processLoopItem(item, key, path, index, pathIndex, parentIndex, promoter) {
  var isObject = typeof item === 'object';
  var model = isObject && getPath(item[key], path, index + pathIndex + 1, key, promoter);
  var isArray = index + 2 === path.length;

  if (!model || !isObject) return;
  model.path = model.path.slice(0);
  model.path[index] = '' + key;
  if (pathIndex && model.path[pathIndex - 1] === '*') model.path[pathIndex - 1] = '' + parentIndex;
  if (model.key === '*') model = getPath(item, model.path, index, 0, promoter);
  if (!model) return;
  return setGetter(
    isArray ? model.model : item, isArray ? model.key : key, {}, model.path, promoter
  );
}

function getLoopPaths(item, path, index, pathIndex, parentIndex, promoter) {
  if (Array.isArray(item)) for (var n = 0, l = item.length; n < l; n++) {
    if (!processLoopItem(item, n, path, index, pathIndex, parentIndex, promoter)) continue;
  } else for (var key in item) {
    if (!processLoopItem(item, key, path, index, pathIndex, parentIndex, promoter)) continue;
  }
}

function getPath(model, path, index, parentIndex, promoter) {
  var item = model, n = index, l = path.length;

  for ( ; n < l; n++) {
    if (path[n] === '*') {
      return getLoopPaths(model[path[n - 1]] || model, path, n, index, parentIndex, promoter);
    }
    if (item[path[n]] === undefined) return;
    model = item;
    item = item[path[n]];
  }
  return { model: model, path: path, key: path[path.length - 1] };
}

}));