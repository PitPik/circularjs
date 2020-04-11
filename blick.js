/**! @license blick v0.1.0; Copyright (C) 2018-2020 by Peter Dematté */
(function defineBlick(global, factory) {
  if (typeof exports === 'object') module.exports =
    factory(global, require('schnauzer'));
  else if (typeof define === 'function' && define.amd) define('blick',
    ['schnauzer'], function (Schnauzer) { return factory(global, Schnauzer) });
  else global.Blick = factory(global, global.Schnauzer);
}(this, function (global, Schnauzer, undefined) { 'use strict';

var saveWrapHtml = (function(search, tags) {
  for (var tag in tags) tags[tag] = document.createElement(tags[tag]);
  return function(htmlText, clone) {
    var tagName = ((htmlText || '').match(search) || [])[1];
    var helper = (tags[tagName] || tags['default']);

    if (clone) helper = helper.cloneNode();
    helper.insertAdjacentHTML('afterbegin', htmlText || '');
    // helper.innerHTML = htmlText || '';
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

var Blick = function(template, options) {
  this.version = '0.1.0';
  this.options = {
    registerProperty: function(fn, key, obj, active, collector){},
    forceUpdate: false,
    attributes: {
      value: setValue,
      disabled: setAttribute,
      checked: setAttribute,
      autocomplete: setAttribute,
      contenteditable: setAttribute,
      readonly: setAttribute,
      required: setAttribute,
      selected: setAttribute,
    },
    renderHook: renderHook,
    isDynamic: function(obj, key) { return true; }
  };
  this.collector = {};
  this.schnauzer = {};
  this.dataDump = [];

  initBlick(this, options || {}, template);
};
var initBlick = function(_this, options, template) {
  for (var option in options) if (option === 'attributes') {
    for (var attr in options[option])
      _this.options[option][attr] = options[option][attr];
  } else {
    _this.options[option] = options[option];
  }
  _this.schnauzer = new Schnauzer(template, _this.options);
  _this.schnauzer.dataDump = [];
};

Blick.prototype = {
  renderHTML: function(data, extra) {
    return resolveReferences(
      this,
      this.schnauzer.dataDump,
      saveWrapHtml(this.schnauzer.render(data, extra))
    );
  },
};

return Blick;

// --- attribute setter helpers

function setAttribute(element, name, value) {
  if (value === true || value === 'true' || (!value && value !== false)) {
    element.setAttribute(name, '');
    element[name] = true;
  } else {
    element.removeAttribute(name);
    element[name] = false;
    if (value === 'focus') element.focus();
  }
}

function setValue(element, name, value) {
  element.setAttribute('value', value);
  element.value = value;
}

// --- main delegators, api hooks and helpers

function findNode(container, pattern) {
  var NODE_TYPE = XPathResult.FIRST_ORDERED_NODE_TYPE;

  return document.evaluate('//text()[contains(., "' + pattern + '")]',
      container, null, NODE_TYPE, null).singleNodeValue ||
    document.evaluate('//@*[contains(., "' + pattern + '")]',
      container, null, NODE_TYPE, null).singleNodeValue;
}

function findEndNode(node, end$) {
  var children = node.parentNode.childNodes;

  for (var n = children.length, child = {}, index = 0, lastNode = null; n--; ) {
    child = children[n];
    if (child.nodeType !== 3) continue;
    index = child.textContent.indexOf(end$);
    if (index === -1) continue;
    lastNode = child.splitText(index + end$.length);
    child.textContent = child.textContent
      .substring(0, child.textContent.length - end$.length);
    break;
  }
  return lastNode;
}

function findSatrtNode(node, start$) {
  node = node.splitText(node.textContent.indexOf(start$)).splitText(0);
  node.textContent = node.textContent.substring(start$.length);
  return node;
}

function renderHook(
  out, tagData, model, isBlock, track, path, key, parent, bodyFn
) {
  var index = this.dataDump.length;
  var isOdd = tagData.isHelper || tagData.isPartial;
  var data = isOdd && tagData.vars[0] &&
    (tagData.vars[0].root = tagData.vars[0]) || tagData;
  var _key = isOdd ? data.root.variable.value : key;
  var doScan = !!data.active || this.options.forceUpdate;
  var isDynamic = !!key && doScan && !!this.options.isDynamic(parent, _key);
  var helper = tagData.helper;
  var scopes = model.scopes;
  var start = '{{#' + index + '}}';
  var end = '{{/' + index + '}}';
  var longKey = '';

  if (!isDynamic && data.active < 3) return out;
  longKey = data.root.variable.path.join('.');
  longKey += (longKey ? '.' : '') + data.root.variable.value;
  this.dataDump.push({
    isBlock: isBlock, track: track, bodyFn: bodyFn, active: data.active,
    isEscaped: data.isEscaped, start$: start, end$: end, path: path,
    noCache: (/^[ew]/.test(helper) || tagData.isPartial) &&
      data.active > 0 || data.active > 2,
    root: scopes[scopes.length - 1].scope, helper: helper,
    scope: scopes[0].scope || {}, parent: parent, key: longKey, out: out,
    helperFn: isOdd ? bodyFn : null, isOdd: isOdd,
  });

  return start + out + end;
}

function resolveReferences(_this, dataDump, html, update) {
  var node = null;
  var renderFn = null;

  for (var n = dataDump.length, dump = {}; n--; ) { // must revers
    dump = dataDump.pop();
    node = findNode(html, dump.start$);
    renderFn = !node ? null : node.ownerElement ?
      attributeFn : !dump.isBlock ?
      inlineFn :
      blockFn;
    if (renderFn) renderFn(
      _this, node, dump.start$, dump.end$, dump, dataDump, update
    );
  }
  return html;
}

// ---- attributes

function attributeFn(_this, node, start$, end$, dump, dataDump) {
  var regexp = />/g;
  var ownerElement = node.ownerElement;
  var attrFn = _this.options.attributes[node.nodeName];
  var update = function(helper) {
    var parentNode = helper.parentNode;

    if (parentNode.nodeType === 11) return;
    if (attrFn) {
      return attrFn(ownerElement, node.nodeName, parentNode.textContent);
    }
    node.textContent = parentNode.textContent.replace(regexp, '');
  };
  var wrap = node._cache = node._cache || // TODO: no saveWrapHtml(); slow;
    saveWrapHtml(node.textContent.replace(regexp, ''), true);
  var helperNode = [].slice.call(wrap.childNodes).filter(function(item) {
    return item.textContent.indexOf(start$) !== -1; // TODO: optimise
  })[0];

  update(!dump.isBlock ?
    inlineFn(_this, helperNode, start$, end$, dump, dataDump, update) :
    blockFn(_this, helperNode, start$, end$, dump, dataDump, update));
}

// ---- inline / textNodes & ChildNodeList

function inlineFn(_this, node, start$, end$, dump, dataDump, update) {
  node = findSatrtNode(node, start$);

  _this.options.registerProperty(replaceInline(node, node.previousSibling,
      findEndNode(node, end$), dump.isEscaped, update, dump.helperFn),
    dump.key, dump.path || dump.key, dump.parent, dump.scope,
    dump.root, dump.active, _this.collector
  );
  return node;
}

function replaceInline(node, firstNode, lastNode, isEscaped, update, helperFn) {
  var fragment = !isEscaped ? document.createDocumentFragment() : null;
  var outContainer = [];

  return function updateInline(data) {
    var childNodes = [];
    var _data = helperFn ? helperFn() : data;

    if (update || isEscaped) {
      node.textContent = _data;
      update && update(node);
      return [];
    }
    outContainer = [];
    childNodes = saveWrapHtml(_data + '').childNodes;
    while(lastNode.previousSibling !== firstNode) {
      lastNode.parentNode.removeChild(lastNode.previousSibling);
    }
    while (childNodes.length) {
      outContainer.push(fragment.appendChild(childNodes[0]));
    }
    lastNode.parentNode.insertBefore(fragment, lastNode);
    return outContainer;
  }
}

// ---- blocks / textNodes and HTMLElements

function blockFn(_this, node, start$, end$, dump, dataDump, update) {
  if (node.textContent.indexOf(end$) !== -1) { // flat structure
    node.splitText(node.textContent.indexOf(start$) + start$.length);
  }
  node = findSatrtNode(node, start$);

  _this.options.registerProperty(
    replaceBlock(_this, node, findEndNode(node, end$),
      dump.bodyFn, dump.track, dump.out, dataDump, update, dump.noCache),
    dump.key,
    dump.path || dump.key,
    dump.parent,
    dump.scope,
    dump.root,
    dump.active,
    _this.collector
  );
  return node;
}

function replaceBlock(
  _this, firstNode, lastNode, bodyFn, track, out, dataDump, update, noCache
) {
  var wasEverRendered = [];
  var fnIdx = track.fnIdx;
  var trackDF = [];

  trackDF[fnIdx] = document.createDocumentFragment();
  wasEverRendered[fnIdx] = !noCache && out.length > 0;

  return function updateBlock(data) {
    var outContainer = [];
    var body = bodyFn(data); // need for track.fnIdx
    var html = {};
    var node = firstNode;
    var prevFnIdx = fnIdx;

    fnIdx = track.fnIdx;
    while ((node = firstNode.nextSibling) && node !== lastNode) {
      noCache ? node.parentNode.removeChild(node) :
        trackDF[prevFnIdx].appendChild(node);
    }
    if (!wasEverRendered[fnIdx] || noCache) {
      trackDF[fnIdx] = trackDF[fnIdx] || document.createDocumentFragment();
      html = resolveReferences(_this, dataDump, saveWrapHtml(body), update);
      while (node = html.childNodes[0]) {
        outContainer.push(trackDF[fnIdx].appendChild(node));
      }
      wasEverRendered[fnIdx] = !!outContainer.length;
    }
    if (body) lastNode.parentNode.insertBefore(trackDF[fnIdx], lastNode);
    update && update(firstNode);
    if (dataDump.length) dataDump.splice(0, dataDump.length);

    return outContainer;
  };
}

}));
