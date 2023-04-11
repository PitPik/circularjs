/**! @license blick v1.0.4; Copyright (C) 2018-2023 by Peter Dematté */
(function(global, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory(global, require('schnauzer'));
  else if (typeof define === 'function' && define.amd)
    define(['schnauzer'], function(Schnauzer) { return factory(global, Schnauzer); }, 'blick');
  else if (typeof exports === 'object') exports['Blick'] = factory(global, require('schnauzer'));
  else global.Blick = factory(global, global.Blick);
}(this, function factory(global, Schnauzer, undefined) { 'use strict';

var saveWrapHtml = (function(search, tags) {
  for (var tag in tags) tags[tag] = document.createElement(tags[tag]);
  return function saveWrapHtml(htmlText, clone, textOnly) {
    var isString = typeof htmlText === 'string';
    var tagName =  isString ? ((htmlText || '').match(search) || [])[1] : undefined;
    var helper = (tags[tagName] || tags['default']);

    if (clone) helper = typeof clone === 'boolean' ?  helper.cloneNode() : clone;
    // textOnly ? helper.textContent = htmlText || '' :
    //   helper.insertAdjacentHTML('afterbegin', htmlText || ''); // helper.innerHTML
    textOnly ?
      (htmlText ? helper.textContent = htmlText : helper.appendChild(document.createTextNode(''))) :
      helper.insertAdjacentHTML('afterbegin', htmlText || ''); // helper.innerHTML
    return helper;
  };
}(/<\s*(\w*)[\s\S]*?>/, {
  option: 'select',
  legend: 'fieldset',
  area: 'map',
  param: 'object',
  thead: 'table',
  tr: 'tbody',
  col: 'colgroup',
  td: 'tr',
  'default': 'div',
}));

var garbage = document.createDocumentFragment(); // to destroy inner components etc.
// var modelId = 0;
// TODO: use usedHelpers for @last, @first, etc.
// TODO: add (in template) expected variable to view model (set in options)

return (function(Schnauzer, cloneObject) { /* class Blick extends Schnauzer */
  var Blick = function Blick(template, options) {
    Schnauzer.call(this, template, options); /* super(); */

    this.options = cloneObject(this.options, {
      registerLoopItem: function(node, item, debugMode, processed) {},
      isDynamic: function(blick, obj, key, vomId, makeDynamic) { return false; },
      scanHTML: function(blick, fragment, item, parent, skip, deleted) {},
      loopHelperName: 'loop-helper',
      loopFnName: '__loopFn',
      loopLimitsName: '__loopLimits',
      limiters: ['{{#', '{{END:', '}}'],
      forceUpdate: false,
      missingProperty: undefined,
      debugMode: '',
      debugLevel: 2,
      attributes: {
        value: setValue,
        disabled: setAttribute,
        hidden: setAttribute,
        checked: setAttribute,
        autocomplete: setAttribute,
        contenteditable: setAttribute,
        readonly: setAttribute,
        required: setAttribute,
        selected: setAttribute,
      }
    });
    this.version = { blick: '1.0.4', schnauzer: this.version };
    this.collector = { destroyers: {}, updaters: {}, movers: {}, helpers: {}, element: {} };
    this.returnFragment = document.createDocumentFragment();
    this.dataDump = [];
    this._firstTimeLoop = null;
    this._tempNode = null; // TODO

    initBlick(this, options || {}, template);
  };

  var initBlick = function(_this, options, template) {
    var tags = [];

    if (typeof template !== 'string') { options = template; }
    cloneObject(options.attributes || {}, _this.options.attributes); // TODO: check
    cloneObject(_this.options, options); // TODO: check
    delete _this.options.helpers; delete _this.options.partials;
    _this.options.renderHook = renderHook; // no way around
    _this.options.loopHelper = loopHelper; // also mandatory

    tags = _this.options.limiters;
    _this.xpath = {
      xpath: [
        '//text()[contains(., "' + tags[0] + '") or contains(., "' + tags[1] + '")]',
        '//@*[contains(., "' + tags[0] + '")]'
      ].join(' | '),
      regex: new RegExp('(' + tags[0] + '|' + tags[1] + ')(\\d+)' + tags[2], 'g'),
      startTag: tags[0],
      type: XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    };
  };
  var destroyInstance = function(coll, idObj) {
    for (var k in idObj) {
      for (var ck in coll.destroyers[k]) unsubscribe(coll, k + ':' + ck);
      delete coll.destroyers[k];
    }
  };
  var renderHTML = function(_this, data, extra, elms) {
    var fragment = _this.returnFragment.childNodes.length ?
      document.createDocumentFragment() : _this.returnFragment;
    _this.controls.active = false; // TODO: check...
    elms = resolveReferences(
      _this, _this.dataDump, saveWrapHtml(_this.render(data, extra), true)
    ).childNodes;
    while (elms.length) fragment.appendChild(elms[0]);
    return fragment;
  };

  (function(ExtKlass, Klass) { // extend
    function Fn() { this.constructor = ExtKlass; }
    for (var key in Klass) if (Klass[key]) ExtKlass[key] = Klass[key];
    Fn.prototype = Klass.prototype;
    ExtKlass.prototype = new Fn();
  })(Blick, Schnauzer);

  Blick.setScroll = setScroll;

  return cloneObject(Blick.prototype, {
    renderHTML: function(data, extra) { return renderHTML(this, data, extra, []) },
    destroyInstance: function(idObj) { destroyInstance(this.collector, idObj) },
    removeChild: function(idx, item, isMoving) { return removeChild(this, idx, item, isMoving) },
    moveChild: function(idx, item, nIdx, nItem, childNodes, skipFix) {
      return moveChild(this, idx, item, nIdx, nItem, childNodes, skipFix)
    },
    addChild: function(idx, item, child) { return addChild(this, idx, item, child) },
    findElement: function(item) { return this.collector.element[item['cr-id'].split(':')[1]] },
  }).constructor;
})(Schnauzer, Schnauzer.cloneObject);

// --- global helpers

function announce(_this, level) {
  if (!_this.options.debugMode || _this.options.debugLevel > level) return;
  if (global.console && global.console[_this.options.debugMode])
    global.console[_this.options.debugMode].apply(null, [].slice.call(arguments).slice(2));
}

// --- attribute setter helpers

function setAttribute(element, name, value) {
  var focus = value.indexOf('focus') !== -1;
  var end = focus && value.indexOf(':end') !== -1;

  if (value === true || value === 'true' ||
      (value && value !== false && value !== 'false' && !focus)) {
    element.setAttribute(name, name === 'selected' ? name : '');
    return function() { element[name] = true };
  } else {
    element.removeAttribute(name);
    if (focus) element.focus();
    if (end) element.selectionStart = element.selectionEnd = element.value.length;
    return function() { element[name] = false };
  }
}

function setValue(element, name, value) {
  element.setAttribute(name, value);
  element.value = value;
  return function() {};
}

// --- main delegators and helpers

function createTextNode(parent, first) {
  var textNode = document.createTextNode('');
  return first ? parent.insertBefore(textNode, parent.childNodes[0]) :
    parent.appendChild(textNode);
}

function fixTable(found, rows, cells, dataDump, nodeT, nodeR, parent) {
  var doTRs = !!cells; // ugly function but works for TABLE and TR only

  if (!doTRs) {
    rows = Array.prototype.slice.call(rows);
    parent = rows[0].parentNode;
    nodeT = createTextNode(parent, true);
    found[found.length - 1].node = createTextNode(parent);
  } else rows = [cells[0].parentNode];

  for (var index = found.length - (doTRs ? 0 : 1), row = rows[0], n = index; n--; ) {
    if (dataDump[found[n].id].tagData.helper !== 'each') continue;
    if (!doTRs && found[n].id === found[index].id) { // TRs
      found[n].node = nodeT;
      break;
    }

    if ((!doTRs && !found[n].isStart) || (doTRs && found[n].isStart)) { // TDs
      row = rows.pop().childNodes;
      parent = row[0].parentNode;
      nodeR = !doTRs && createTextNode(parent, !doTRs);
      found[n].node = createTextNode(parent, doTRs);
    } else found[n].node = nodeR || createTextNode(rows[0], !doTRs);
  }
}

function findNodes(data, html, out, dataDump, loopHelperName) {
  var items = document.evaluate(data.xpath, html, null, data.type, null);
  var node, attr, item;
  var found = [];
  var index = 0;
  var delta = 0;

  while (node = items.snapshotItem(index++)) {
    found = [];
    delta = 0;
    node.textContent = node.textContent.replace(data.regex, function(all, sign, num, idx) {
      item = { id: +num, isStart: sign === data.startTag, index: idx - delta };
      found.push(item);
      delta += all.length;
      return '';
    });

    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      attr = node;
      node = saveWrapHtml(node.textContent, true, true).firstChild;
    } else attr = undefined;

    if (node.nextSibling && (node.nextSibling.rows || node.parentNode.rows) &&
        dataDump[item.id].tagData.helper === 'each' || node.parentNode.rows) // TODO: last || .rows
      fixTable(found, node.nextSibling.rows, (node.parentNode.rows || [{}])[0].cells, dataDump);
      
    for (var n = found.length; n--; ) {
      item = found[n];
      // TODO: !!!! find out if previous end node is start node (or visa versa) so we can share it
      if (!out[item.id]) out[item.id] = { start: item.node || node, end: node, attr: attr };

      if (item.node) out[item.id][item.isStart ? 'start' : 'end'] = item.node;
      else if (!item.isStart) out[item.id].end = node.splitText(item.index);
      else out[item.id].start = node.splitText(item.index).splitText(0).previousSibling;
    }
  }
  return out;
}

function resolveReferences(_this, dataDump, html, update, stopRender) {
  var nodes = dataDump.length &&
    findNodes(_this.xpath, html, [], dataDump, _this.options.loopHelperName);
  var dump, renderFn;

  if (stopRender && nodes) _this._tempNode = nodes[dataDump[0].id].start; //.splitText(0);
  while (dump = dataDump.shift()) if (renderFn = !nodes[dump.id] ? null : nodes[dump.id].attr ?
    attributeFn : dump.tagData.tag !== 'B' ? // TODO: ... // && !dump.helperFn
    inlineFn :
    blockFn) renderFn(_this, nodes[dump.id], dump, dataDump, update);
  else announce(_this, 3, 'Missing NodeElement in template:', { template: html.innerHTML });

  return html;
}

// --- api hooks and helpers

function saySomething(_this, hasValue, isDynamic, tagData, cData, data, key) {
  if (hasValue) {
    if (isDynamic === 1) announce(_this, 1, 'Engaging property',
      tagData.helper && tagData.helper.value || tagData.helper || '-',
      '"' + key + '" ->', cData.value, data.length, isDynamic);
    else if (isDynamic === 2) announce(_this, 2, 'Added model activity: "' + key + '" ->', cData.value);
    else announce(_this, 2, 'Missing model activity: "' + key + '" ->', cData.value);
  } else if (!hasValue && _this.options.missingProperty !== undefined) {
    // TODO: what was this again? //  _this.options.missingProperty ... stil need to update in VOM
    announce(_this, 2, 'Installing', cData, 'not supported yet if not in model');
  } else if (!hasValue && _this.options.missingProperty === undefined) {
    announce(_this, 3, 'Property "' + key + '", defined in template' + (tagData.helper ?
      ' by block "' + (tagData.helper.value || tagData.helper) + '"' : '') + ', is missing in model.');
  }
}

function getRenderArgsActives(args, data, actives) {
  for (var n = 0, variable = {}, l = args.length; n < l; n++) {
    variable = args[n].variable;
    if (args[n].renderArgs) getRenderArgsActives(args[n].renderArgs, args[n], actives);
    if (!variable.active) continue;
    if (data.value !== undefined) { // TODO: check if we should add to model or announce
      data.renderArgs[n].parentHelper = data;
      actives.push(data.renderArgs[n]);
    }
  }
}
// TODO: scanHTML on !wasEverRendered, but (maybe only) on regular stuff
// Maybe we can use this.active instead?
function getIfElseActives(_this, tags, getData, tagData, actives) {
  for (var n = 1, l = tags.length, data; n < l; n++) {
    if (!tags[n].vars.length) continue;
    data = getData(tags[n]);
    for (var m = data.length; m--; ) getActives(_this, actives, data[m], data, tagData);
  }
}

function getActives(_this, actives, cData, data, tagData) {
  var variable = cData.variable;
  var hasValue = cData.value !== undefined;
  var key = cData.key || variable.value;
  var isDynamic = 0;
  var partial = tagData.partial && tagData.partial.value;

  if (variable.value === 'cr-scroll' && data[0].variable.active) data[0].scrollers = {};
  if (cData.renderArgs && !partial) getRenderArgsActives(cData.renderArgs, cData, actives); // TODO: check partial
  // TODO: Check if tagData.partial has any other consequences
  if (!variable || !variable.active || partial === variable.value) return;

  if (key === 'this') { /* TODO */ }
  if (key.charAt(0) === '@') { // TODO: clean up...
    if (cData.parent[key] === undefined) cData.parent[key] = ''; // makes getter possible
    hasValue = true;
    if (variable.depth) cData.movingParent = true; // TODO: maybe? also for non-helpers?
  }
  if (variable.path[0] === '@root') cData.isFromRoot = true;

  if (cData.loop && !cData.parent.parent) Object.defineProperty(cData.parent, '__cr-id', {
    value: cData.loop['@root']['__cr-id'] });
  if (!cData.parent['cr-id'] && !cData.parent.this) Object.defineProperty(cData.parent, 'cr-id', {
    value: cData.loop.this['cr-id'] || cData.loop['@parent']['cr-id'],
  });
  isDynamic = _this.options.isDynamic(cData, key, _this.options.forceUpdate);
  if (isDynamic === null) {
    return announce(_this, 3, 'No subscriber defined for:', '"' + key + '"', 'in:', cData.parent);
  }

  if (_this.options.debugMode) saySomething(_this, hasValue, isDynamic, tagData, cData, data, key);
  if (hasValue) actives.push(cData); // TODO: !hasValue ... do something about this
}

function renderHook(_this, out, data, bodyFn, tagData, track, getData) {
  var tags = _this.options.limiters;
  var tmp = _this.dataDump.length + tags[2];
  var isHelperOrPartial = tagData.tag !== 'B' &&  // TODO: check!!!!!!!
    ((tagData.helper && !tagData.helperFn) || !!tagData.partial); // TODO: check
  var actives = [];

  // TODO: check partial; TODO: maybe delete stuff as helpers etc (check first)...
  for (var n = 0, l = data.length; n < l; n++)
    if (data[n].parent) getActives(_this, actives, data[n], data, tagData); // static values possible
    else if (data[n].renderArgs) getRenderArgsActives(data[n].renderArgs, data[n], actives);
  if (getData) getIfElseActives(_this, tagData.children, getData, tagData, actives);

  if (actives.length === 0 || tagData.partial) return out; // TODO: check partial ... earlier; before for()

  _this.dataDump.push({
    id: _this.dataDump.length,
    out: out,
    track: track,
    bodyFn: bodyFn,
    data: data,
    actives: actives,
    tagData: tagData,
    helperFn: isHelperOrPartial ? bodyFn : null, /* TODO: helperFn? remove this...? */
  });
  return tags[0] + tmp + out + tags[1] + tmp;
}

// ------------- registerProperties ----------------

function triggerAllHelperFns(item, data) {
  item.value = item.variable.renderFn(item.renderArgs);
  if (data) for (var n = data.length; n--; ) {
    if (data[n].renderArgs && item.renderArgs !== data[n].renderArgs) {
      triggerAllHelperFns(data[n]);
    }
  }
}

function getPropertyUpdateFn(item, data, udateFn, loopLimitsName) {
  var parentHelper = item.parentHelper;
  var parentHelperFn = parentHelper && parentHelper.variable.renderFn;
  var renderArgs = parentHelper && parentHelper.renderArgs;
  var isDeep = !!item.variable.path.length;

  return function updateProperty(value, stop, parent) {
    var loopLimits = value !== undefined && value !== null && (value[loopLimitsName] || '').length;
    var isArray = item.type === 'array';

    if (isDeep && parent !== item.parent) return;
    if (!isArray && value === item.value && item.variable.active < 2) return;

    item.value = value;
    if (parentHelperFn) {
      if (renderArgs !== data[0].renderArgs) triggerAllHelperFns(parentHelper, data[0].renderArgs);
      data[0].value = parentHelperFn(data[0].renderArgs);
    }
    udateFn(data, item.loop, stop || loopLimits && (!isArray || value.length !== 0), item.scrollers);
  };
}

function addUpdater(updaters, id, varName, updatePropertyFn) {
  if (!updaters[id]) updaters[id] = {};
  if (updaters[id][varName]) updaters[id][varName].push(updatePropertyFn);
  else updaters[id][varName] = [updatePropertyFn];

  return updaters[id][varName];
}

function addDestroyer(destroyers, ids) { // TODO: empty destroyers in DBMonster
  var tmpDestroyer = destroyers[ids[0]] = destroyers[ids[0]] || {};

  if (ids[1] === undefined) ids[1] = 'root';
  return tmpDestroyer[ids[1]] = tmpDestroyer[ids[1]] || []; 
}

function getDestroyer(container, updatePropertyFn) {
  return function find() { return container.splice(container.indexOf(updatePropertyFn), 1)[0] };
}

function getMover(updaters, collector, propFn, variable, depth) { // TODO: something is not smooth here......
  var getter = getDestroyer(updaters, propFn); // TODO: remove yourself...

  return function moveDestroyer(item) { // TODO: check if no function but id only (not crucial though)
    var propFn = getter();
    var updater = collector.updaters; // will be replaced
    var num = depth;

    if (!item) return; // used for just deleting...

    while (num) { item = item.parentNode || {}; num--; }
    updater = collector.updaters[item['cr-id']];
    updater[variable].push(propFn);
  }
}

function addHelper(_this, helpers, item, itemID, variable) {
  if (!_this.controls.helpers) _this.controls.helpers = true;
  helpers[itemID] = helpers[itemID] || {};
  helpers[itemID][variable] = item.parent;
}

function registerProperties(_this, udateFn, collector, data, items, children) {
  for (var n = items.length, item = {}, variable = '', parentId = '', propFn, loop = '', updaters; n--; ) {
    item = items[n];
    variable = item.key || item.variable.value;
    propFn = getPropertyUpdateFn(item, data, udateFn, _this.options.loopLimitsName);
    loop = item.loop && item.loop.this['cr-id'];
    parentId = item.parent['this'] !== undefined ? item.parent.this['cr-id'] : item.parent['cr-id'];
    if (item.parent['cr-id'] === undefined) Object.defineProperty(item.parent, 'cr-id', {
      value: parentId,
    });

    addDestroyer(collector.destroyers, parentId.split(':'));
    updaters = addUpdater(collector.updaters, parentId, variable, propFn);
    if (variable.charAt(0) === '@') addHelper(_this, _this.collector.helpers, item, parentId, variable);
    if (item.movingParent) // TODO: check if also needed for non-helpers...
      addUpdater(collector.movers, loop, variable,
        getMover(updaters, collector, propFn, variable, item.variable.depth)
      );
    if (item.isFromRoot) addDestroyer(collector.destroyers, loop.split(':'))
      .push(getDestroyer(updaters, propFn)); // This works...
  }
  if (children) registerLoop(_this, children, udateFn, data, items, []);
}

// --------------- clean up / used in removeChild() and destroyInstance()

function destroy(name, updater, ids, collector) {
  var destroyers = collector.destroyers[ids[0]], destroyer;

  delete updater[name];
  if (destroyers[ids[1]]) {
    while (destroyer = destroyers[ids[1]].shift()) destroyer();
    delete destroyers[ids[1]];
  }
}

function unsubscribe(collector, id, item, getChildren) {
  var updaters = collector.updaters;
  var vomIds = id.split(':');
  var movers = collector.movers;

  delete collector.element[vomIds[1]]; // works...
  if (vomIds[1] === 'root') id = vomIds[0];
  for (var varName in updaters[id]) destroy(varName, updaters[id], vomIds, collector);
  delete updaters[id];
  delete collector.helpers[id];

  if (movers = collector.movers[id]) {
    for (var key in movers) for (var n = movers[key].length; n--; ) movers[key][n]();
    delete collector.movers[id];
  }

  if (item) for (var children = getChildren(item), n = children.length; n--; )
    unsubscribe(collector, children[n]['cr-id'], children[n], getChildren);
}

// --------------- loop handlers / helpers

function registerLoop(_this, nodes, fn, data, items, limiters) {
  var idx = data[0].value.length;
  var lastIdx = -1;

  for (var n = nodes.length, options = _this.options; n--; ) {
    if (nodes[n].nodeType === 8 && nodes[n].textContent === options.loopHelperName) {
      limiters.unshift(nodes[n - 1]); // nodes[n - 1] is definitely text node ' <!--' ...
      nodes[n].parentNode.removeChild(nodes[n]);
      idx--;
    } else if (nodes[n].nodeType !== 3) {
      _this.collector.element[data[0].value[idx]['cr-id'].split(':')[1]] = nodes[n];
      options.registerLoopItem(nodes[n], data[0].value[idx], options.debugMode, lastIdx === idx);
      lastIdx = idx;
    }
  }
  if (!items[0].value[options.loopLimitsName])
    Object.defineProperty(items[0].value, options.loopLimitsName, { value: limiters });
}

function loopHelper(_this, out, main, idx, loopFn, isActive) {
  var loopFnName = _this.options.loopFnName;
  var activeVar = main.variable.active;
  var value = main.value;
  var helper = !activeVar ? '' : ' <!--' + _this.options.loopHelperName + '-->'; // white-space!!
  // console.warn(typeof out, !!loopFn, out); // TODO: keep following for check...
  if (typeof out === 'function') {
    if (!value[loopFnName] && activeVar) Object.defineProperty(value, loopFnName, { value: out }) && '';
    return;
  }
  if (!loopFn) return value && value.length ? '' : helper; // 2x call loopHelper(): idx
  announce(_this, 0, 'loopHelper:', '->', main);
  if (value && !value[loopFnName] && activeVar) Object.defineProperty(value, loopFnName, { value: loopFn });
  if (value && !value['cr-id'] && !activeVar) value['cr-id'] = main.parent['cr-id'];

  return (!idx && !isActive ? helper : '') + out + helper;
}

// ---- loop item manipulation (re-render)

function helperUpdater(item, helper, idx, props) {
  var len = item.length;
  var n = props.length, key = '', prop = helper;

  if (!helper) return;
  for ( ; n--; ) {
    if (helper[key = props[n]] === undefined) continue; // don't update if not needed
    prop = helper[key]; // TODO: maybe update here this, ., @parent ... but if it's only for @s...  

    if (n === 0 /* index */) prop[key] = idx;
    else if (n === 1 /* key */) prop[key] = !Array.isArray(item) ? Object.keys(item)[idx] : idx;
    else if (n === 2 /* number */) prop[key] = idx + 1;
    else if (n === 3 /* odd */) prop[key] = idx % 2 !== 0;
    else if (n === 4 /* first */) prop[key] = idx  === 0;
    else if (n === 5 /* last */) prop[key] = idx  === len - 1;
    else if (n === 6 /* length */) prop[key] = len;
    else if (n === 7 /* depth */) prop[key] = updateDepth(item); // TODO: optimise...
  }
}

function updateDepth(test) {
  var depth = 0;

  while (test && test.parent) { depth++; test = test.parent; }
  return depth;
}

function crawlHelpers(item, collector, key, childNodes) {
  for (var n = item[childNodes].length, child = item, id = '', depth = 0; n--; ) {
    child = item[childNodes][n];
    id = child['cr-id'];
    if (collector.updaters[id][key].length) depth = updateDepth(item[childNodes]);
    for (var m = collector.updaters[id][key].length; m--; )
      collector.helpers[id][key][key] = depth;
    if (child[childNodes].length) crawlHelpers(child, collector, key, childNodes);
  }
}
// TODO: revisit for efficiancy
function updateHelpers(_this, index, item, movedItem, remove, newIndex, newItem, childNodes) {
  var props = ['@index', '@key', '@number', '@odd', '@first', '@last', '@length', '@depth'];
  var helpers = _this.collector.helpers;
  var hasHelpers = helpers[(item[0] || movedItem)['cr-id']]; // Object.keys(helpers).length !== 0;
  var n = 0, l = 0, key = '', collector, tmp;
  var changedItem = movedItem || item[index];
  var updaters = _this.collector.updaters[changedItem['cr-id']];
  var currItem = newItem && newItem[newIndex];
  var len = !remove && hasHelpers ? updaters['@length'] : true; // TODO: true???
  var updater = hasHelpers && function(idx, delta, collection) { // less performant but smaller...
    helperUpdater(collection, helpers[collection[idx]['cr-id']], idx - delta, props);
  };

  if (!hasHelpers) return;
  if (remove) for (n = len ? 0 : index, l = item.length; n < l; n++) updater(n, 0, item); // 1???
  else if (!movedItem) for (n = len ? 0 : index + 1, l = item.length; n < l; n++) updater(n, 0, item);
  else if (movedItem) {
    if (item !== newItem) {
      collector = _this.collector.movers[currItem['cr-id']];
      for (key in collector) while (tmp = collector[key].shift()) tmp(changedItem);
    }
    for (n = len ? 0 : newIndex, l = newItem.length; n < l; n++) updater(n, 0, newItem);
    for (n = len ? 0 : index, l = item.length; n < l; n++) updater(n, 0, item); // old parent
    if (updaters['@depth'] && childNodes) crawlHelpers(currItem, _this.collector, '@depth', childNodes);
  }
}

// ----

function removeChild(_this, index, item, child, isMoving, newParent) { // TODO: check how to use newParent
  var options = _this.options;
  var limits = item[options.loopLimitsName];
  var start = limits && limits[index].nextSibling;
  var end = limits && limits[index + 1].nextSibling;
  var tmp = start;

  if (!limits) throw('Blick error: Array is not defined as being dynamically mutable');
  if (!start || !end || limits.length !== item.length + (isMoving ? 1 : 2) && !newParent)
    return announce(_this, 3, 'Blick error: model doesn\'t match view. \nModel:', item);

  while ((start = tmp) && start !== end && (tmp = start.nextSibling)) garbage.appendChild(start);
  limits.splice(index + 1, 1);

  if (isMoving) return garbage;

  unsubscribe(_this.collector, child[['cr-id']], child,
    options.scanHTML(_this, garbage, child, item, false, true));
  if (_this.controls.helpers) updateHelpers(_this, index, item, child, true);
  return garbage;
}

function moveChild(_this, index, item, newIndex, newItem, childNodes, skipFix) { // TODO: ../foo different parent?
  var options = _this.options;
  var limits = newItem[options.loopLimitsName];
  var newParent = item !== newItem;
  var end = limits[newIndex + (newParent || item === newItem && newIndex < index ? 0 : 1)];
  var tmp = item[options.loopLimitsName][index + 1];

  if (index === newIndex && item === newItem) return; // nothing to move...
  if (!end) limits.push(end = _this._tempNode); _this._tempNode = null;
  if (!end.nextSibling) end.parentNode.appendChild(removeChild(_this, index, item, item[index], true, newParent));
  else end.parentNode.insertBefore(removeChild(_this, index, item, item[index], true, newParent), end.nextSibling);
  limits.splice(newIndex + 1, 0, tmp);
  if (!skipFix && _this.controls.helpers) updateHelpers(
    _this, index, item, newParent ? newItem[newIndex] : item[index], false, newIndex, newItem, childNodes
  );
}

function addChild(_this, index, item, child) {
  var options = _this.options;
  var COMMENT_NODE = Node.COMMENT_NODE;
  var limiters = item[options.loopLimitsName];
  var fn = item[options.loopFnName]; // ...
  var end = (limiters || {})[index];
  var limit = end;
  var out = end; // just to point to address

  if (!limiters) throw('Blick error:\n- Template might have wrong notation(s).\n- Check %variable.');
  if (limiters.length === 2 && item.length === 1 && limiters[0].parentNode.childNodes.length > 4)
    return;
  if (!fn || !end) return;

  _this.controls.active = false;
  out = _this._firstTimeLoop || // is fragment, not a wrapper
    resolveReferences(_this, _this.dataDump, saveWrapHtml(fn(child, index)));
  _this.controls.active = true;

  options.scanHTML(_this, out, item[index], item);

  for (var nodes = out.childNodes, n = nodes.length; n--; ) {
    if (nodes[n].nodeType === COMMENT_NODE && nodes[n].textContent === options.loopHelperName) {
      nodes[n].parentNode.removeChild(nodes[n]); // need to clean saveWrapHtml
      limiters.splice(index + 1, 0, limit = nodes[--n]);
      end = end.nextSibling ?
        end.parentNode.insertBefore(limit, end.nextSibling) :
        end.parentNode.appendChild(limit);
      continue;
    }
    if (nodes[n].nodeType === 1) _this.collector.element[item[index]['cr-id'].split(':')[1]] = nodes[n];
    end = end.parentNode.insertBefore(nodes[n], end);
  }
  if (_this._firstTimeLoop) { limiters.splice(1, 1); _this._firstTimeLoop = null; }
  if (_this.controls.helpers) updateHelpers(_this, index, item);
}

// ---- attributes / delegates to updateInline and updateBlock

function attributeFn(_this, nodes, dump, dataDump) {
  var regexp = />/g;
  var ownerElement = nodes.attr.ownerElement;
  var attrName = nodes.attr.nodeName;
  var attrFn = _this.options.attributes[attrName];
  var update = function(helper) {
    var helperNode = helper.parentNode;

    if (helperNode.nodeType === 11) return;
    if (attrFn) return attrFn(ownerElement, attrName, helperNode.textContent)();
    nodes.attr.textContent = helperNode.textContent.replace(regexp, '');
  };

  return update(dump.tagData.tag !== 'B' ? // TODO: use this
    inlineFn(_this, nodes, dump, dataDump, update) :
    blockFn(_this, nodes, dump, dataDump, update));
}

// ---- inline / textNodes & ChildNodeList

function inlineFn(_this, nodes, dump, dataDump, update) {
  var node = nodes.start; // findStartNode(node, start$);
  registerProperties(_this, replaceInline(node, nodes.end, // findEndNode(node, end$),
      dump.tagData.isEscaped, update, dump.helperFn), _this.collector, dump.data, dump.actives);
  return node; // TODO: use this
}

function replaceInline(firstNode, lastNode, isEscaped, update, helperFn) {
  var fragment = !isEscaped && !update ? document.createDocumentFragment() : null;
  var dataNode = firstNode.nextSibling;

  return function updateInline(data, helpers) { // inlines never have arr? helpers
    var childNodes = [];
    var _data = helperFn ? helperFn(data, helpers) : data[0].value; // helperFn === bodyFn
    var child = firstNode;
    var newChild = null;

    if (update || (isEscaped && !helperFn)) { // TODO: re-check (isEscaped && !helperFn)
      dataNode.textContent = _data;
      update && update(dataNode);
      return _data;
    }
    childNodes = saveWrapHtml(_data + '').childNodes;

    while (child.nextSibling !== lastNode) if (childNodes.length) {
      child.parentNode.replaceChild(newChild = childNodes[0], child.nextSibling);
      child = newChild;
    } else child.parentNode.removeChild(child.nextSibling);
    if (!childNodes.length) return;

    while (childNodes.length) fragment.appendChild(childNodes[0]);
    lastNode.parentNode.insertBefore(fragment, lastNode);
  }
}

// ---- blocks / textNodes and HTMLElements

function blockFn(_this, nodes, dump, dataDump, update) {
  var isEach = dump.tagData.helper === 'each' || // TODO: also do Object and loose array
    (!dump.tagData.helper && !dump.data[1] && dump.data[0].type === 'array');
  var tmp = nodes.start; // temporary
  var children = isEach ? [] : undefined;
  var node = isEach ? nodes.start.nextSibling : nodes.start; // TODO... about flat structure

  if (isEach) while (tmp && tmp !== nodes.end.nextSibling) { children.push(tmp); tmp = tmp.nextSibling; }
  else if (dump.data[0].scrollers) setScroll(true, dump.data[0], dump.track.fnIdx, node.parentNode);
  registerProperties(_this, replaceBlock(
      _this, node, nodes.end, dump.bodyFn, dump.track, dump.out, dataDump, update, isEach
    ), _this.collector, dump.data, dump.actives, children);
  return node; // TODO: use this
}

function setScroll(save, data, fnIdx, html) {
  if (html) data.scrollers[fnIdx] = html.querySelectorAll('[cr-scroll]');
  for (var n = data.scrollers[fnIdx].length, item = data; n--; ) {
    item = data.scrollers[fnIdx][n];
    if (html) item.removeAttribute('cr-scroll'); // TODO: options.debug...
    if (save) item.__scroll = { y: item.scrollTop, x: item.scrollLeft };
    else { item.scrollTop = item.__scroll.y; item.scrollLeft = item.__scroll.x; }
  }
  return data;
}

function replaceBlock(_this, firstNode, lastNode, bodyFn, track, out, dataDump, update, isEach) {
  var wasEverRendered = [];
  var fnIdx = track.fnIdx;
  var trackDF = [];
  var options = _this.options;

  trackDF[fnIdx] = document.createDocumentFragment();
  wasEverRendered[fnIdx] = out.length > 0;
  track.checkFn = function(currentFnIdx) { // ugly, but it does its job best
    if (!wasEverRendered[currentFnIdx]) _this.controls.active = false;
  };

  return function updateBlock(data, helpers, stopRender, isScroll) { // TODO: check helpers for siblings
    var dummy = isScroll ? setScroll(true, data[0], fnIdx) : undefined; // before bodyFn()
    var arrData = data[0].value && data[0].value.length; // null
    var body = bodyFn(data, helpers, stopRender); // track.checkFn() gets triggered here...
    var html = firstNode; // fake
    var node = firstNode;
    var wasNotRendered = !wasEverRendered[track.fnIdx];
    var wasElse = fnIdx > track.fnIdx && isEach && wasEverRendered[track.fnIdx] === undefined;
    var item = data[0].loop && data[0].loop['this'];
    var diff = fnIdx !== track.fnIdx;

    if (fnIdx !== track.fnIdx || !body) { // TODO: check || !body ... good for existing data (faster)
      while ((node = firstNode.nextSibling) && node !== lastNode) trackDF[fnIdx].appendChild(node);
    }
    fnIdx = track.fnIdx;
    if (wasNotRendered) { // this is for if/else only, not for loops
      trackDF[fnIdx] = trackDF[fnIdx] || document.createDocumentFragment();
      html = resolveReferences(_this, dataDump, saveWrapHtml(body), update,
        stopRender === options.loopHelperName);
      if (isScroll) setScroll(true, data[0], fnIdx, html);
      while (node = html.childNodes[0]) trackDF[fnIdx].appendChild(node);
      wasEverRendered[fnIdx] = !!body; // !!trackDF[fnIdx].childNodes.length; // ...or just true?
    }

    if (wasElse && data[0].value[options.loopLimitsName] && arrData) { // TODO: check
      _this._firstTimeLoop = trackDF[fnIdx]; // TODO: spooky
      return (data[0].value[options.loopLimitsName].push(firstNode), ''); // TODO: check
    } else if (wasNotRendered && body && !update) options.scanHTML(_this, trackDF[fnIdx], item,
      data[0].renderArgs ? data[0] : data[0].parent['__cr-id'] && data[0].parent || data[0].value, 'skip');

    if (body) lastNode.parentNode.insertBefore(trackDF[fnIdx], lastNode); // TODO: check...
    if (isScroll && body) setScroll(false, data[0], fnIdx);
    if (update) { if (!diff) firstNode.nextSibling.textContent = body; update(firstNode); }
    if (dataDump.length) dataDump.splice(0, dataDump.length);
  };
}

}));
