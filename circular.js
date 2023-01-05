/**! @license CircularJS ● v2.0.0; Copyright (C) 2017-2023 by Peter Dematté */
define(['toolbox', 'blick', 'VArray', 'api', 'controller'],
function(Toolbox, Blick, VArray, mixinAPI, Controller) { 'use strict';

var id = 0;
var components = {};
var instances = {};

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var $create = Toolbox.$create;
var isArray = Toolbox.isArray;
var keys = Toolbox.keys;
var extend = Toolbox.cloneObject;

var Circular = function Circular(name, options) {
  this.controls = { initPartials: false };
  this.version = '2.0.0';
  this.id = 0;
  this.name = '';
  this.options = {
    hash: '#',
    partials: {},
    helpers: {},
    attributes: {},
    debug: 0,
  };

  initCircular(this, name, options || {});
}
var initCircular = function(_this, name, options) {
  var isName = typeof name === 'string';

  if (!isName) options = name || {};
  for (var option in options) _this.options[option] = options[option];

  _this.id = 'cr_' + id++;
  _this.name = isName ? name : _this.id;
  instances[_this.id] = {};
}

Object.defineProperties(Circular.prototype, mixinAPI({
  createComponent: { value: function(selector, attrs, component, node) {
    var inst = getInstanceData(component['__cr-id']);
    var elm = document.createElement(selector);

    for (var attr in attrs) elm.setAttribute(attr, attrs[attr]);
    (node || inst.element).appendChild(elm); // TODO: maybe offer insertBefore...
    initInnerComponents(inst, node || inst.element, selector);
    return elm;
  }},
  initComponents: { value: function(selector, component, fragment) {
    var inst = getInstanceData(component['__cr-id']);
    var container = fragment || inst.element;

    return initInnerComponents(inst, fragment, selector);
  }},
  getChildComponents: { value: function(inst) { // do we ever need this?
    var parts = inst['__cr-id'].split(':');
    var children = instances[parts[0]][parts[1]].children;
    var out = [];
// TODO: use getInstanceData(id)
    for (var n = children.length; n--; ) {
      parts = children[n].split(':');
      out.push(getComponent(this, parts[1], parts[0]));
    }
    return out;
  }},
  getParentComponent: { value: function(inst) { // do we ever need this?
    // TODO: use getInstanceData(id)
    return getComponent(this, instances[this.id][inst['__cr-id'].split(':')[1]].parent.split(':')[1]);
  }},
  hideComponent: { value: function(inst) {
    // TODO: return showComponent
  }},
  destroyComponent: { value: function(elm, remove) { // TODO: elm as selector??
    if (elm) {
      destroyComponent(elm['cr-id'], getInstanceData(getInstanceData(elm['cr-id']).parent));
      if (remove) elm.parentNode.removeChild(elm);
    }
  }},
  destroy: { value: function() {
    var insts = instances[this.id];
    // TODO: this.destroyComponents doesn't exists
    this.destroyComponents(keys(insts).map(function(key) { return insts[key].instance; }));
   }},
  // getAttributeData: { value: getAttrMap },
}, Circular));

return Object.defineProperties(Circular, {
  Service: { value: function(defData, Klass) { /* TODO: brand new thought */ }},
  Module: { value: function(defData, Klass) {
    defData.initialize = true;
    return Circular.Component(defData, Klass);
  }},
  Component: { value: function(defData, Klass) {
    var doesExist = !!components[defData.selector];
    var crInst = defData.circular || Circular.CreateInstance();
    var childNames = !doesExist && processSubscribers(defData.subscribe$ || (defData.subscribe$ = {}), {});
    var component =  doesExist ? components[defData.selector] : (components[defData.selector] = {
      Klass: Klass,
      selector: defData.selector,
      subscribe$: defData.subscribe$,
      childNames: childNames, // TODO: check above logic...
      template: defData.template &&
        processTemplate(defData.template, getBlickOptions(crInst.options, defData)),
      styles: installStyles(defData.styles, defData.selector),
      singleton: false, // ????
      initialize: false,
      crInst: crInst,
      init: function init(element, plugData, parent) {
        if (defData.initialize) component.initialised = true;
        return initComponent($(element), this, defData, plugData, parent);
      },
      // preparePlugin: function preparePlugin() {
      //   //...
      // },
    });
    var elm = defData.initialize ? $(defData.selector, defData.context) : {};

    registerPartials(crInst, component); // Well...
    if (defData.initialize) delete components[defData.selector]; // TODO: what about destroy??

    return component.initialised ? null : defData.initialize ? {
      component: component,
      instance: component.init(elm),
      element: elm,
    } : component;
  }},
  Plugin: { value: function(defData, Klass) {
    return Circular.Component(defData, Klass);
  }},
});

/* -------------------- private functions ------------------- */

function getInstanceData(id) {
  id = id.split(':');
  return instances[id[0]][id[1]];
}

function getComponent(_this, cId, crId) { // splitting here...
  var data = instances[crId || _this.id][cId];
// TODO: use getInstanceData(id)
  return data && { element: data.element, instance: data.instance, name: data.name };
}

function initComponent(element, component, defData, plugData, parent) {
  var crInst = component.crInst;
  var ID = id++;
  var elmId = element['cr-id'];
  var isExisting = elmId && !plugData;
  var template = component.template;
  var inst = !isExisting ? instances[crInst.id][ID] = {
    instance: {}, controller: {}, models: [], parent: '', template: template,
    element: element, crInst: crInst, children: [], views: {}, listeners: {}, destroyers: [],
  } : null;
  var content = Toolbox.trim(element.innerHTML);
  var name = crInst.id + ':' + ID;
  var blickOptions = component.template.blick.options;

  if (isExisting || (component.singleton && !plugData)) return getInstanceData(elmId);

  component.singleton = !!defData.singleton || defData.initialised;
  if (!plugData) {
    element['cr-id'] = name;
    inst.crInst.options.debug && element.setAttribute('cr-id', name);
  }

  if (content) element.innerHTML = addComponentPartial(template, content, blickOptions);
  inst.name = defData.selector;
  inst.controller = new Controller(element);
  if (parent) {
    inst.parent = parent['__cr-id'];
    getInstanceData(inst.parent).children.push(name); // YESSS :) in destroyItems
  }
  inst.instance = initInstance(component, inst, plugData, name);
  Object.defineProperty(inst.instance, '__cr-id', { value: name });
  inst.models = keys(component.subscribe$)
    .sort(function(a) { return a === 'this' ? -1 : 1 }) // TODO: find order...
    .reduce(function(acc, key) {
      var model = applyModel(key, component, inst);
      acc[model['id']] = model; // TODO: 'id'
      return acc;
    }, {});

  inst.template.blick.cr_component = inst; // TODO: uuuuaaaaaa
  // TODO: plugins
  // inst.instance.onBeforeInit && inst.instance.onBeforeInit(element, crInst);
  if (template) renderComponent(inst, defData.extra);
  inst.instance.onInit && inst.instance.onInit(element, crInst);

  return inst;
}

function destroyComponent(id, parentInst) {
  var parts = [];
  var inst = {};

  // TODO: use getInstanceData(id)
  if (!id) return;
  parentInst.children.splice(parentInst.children.indexOf(id), 1);
  parts = id.split(':');
  inst = instances[parts[0]][parts[1]];

  delete instances[parts[0]][parts[1]];
  for (var n = inst.destroyers.length; n--; ) inst.destroyers[n](); // parent child listeners

  if (inst.instance.onDestroy) inst.instance.onDestroy();
  inst.template.blick.destroyInstance(inst.models); // TODO: check again inst.models...
  // TODO: check if following 2 is actually needed as we loose reference anyhow...
  for (var key in inst.models) inst.models[key].model.destroy();
  inst.controller.destroy();
  for (var n = inst.children.length; n--; ) destroyComponent(inst.children[n], inst);

  // for (var key in inst) inst[key] = null; // TODO: needed??
}

// ------------- components and instances

function renderComponent(inst, extra) {
  var fragment = inst.template.blick.renderHTML(inst.instance, extra);
  var firstKey = keys(inst.models)[0];
  var vArray = inst.models[firstKey].model;

  initInnerComponents(inst, fragment);
  addInstanceEvents(inst, vArray, fragment);
  inst.element.removeAttribute('cr-cloak');
  inst.element.appendChild(fragment);
}

// TODO: just an idea: don't inst.element.appendChild(fragment) until
function initInnerComponents(inst, element, selector) {
  var query = inst.template.childQuery || [];
  var children = inst.template.childComponents;
  var isLazy = false, newInst;

  if (!selector && (!children.length || !element.firstElementChild)) return;
  if (typeof query !== 'string') {
    for (var n = children.length; n--; ) query.push(children[n]);
    inst.template.childQuery = query.join(',');
  }

  for (var elms = $$(selector || inst.template.childQuery, element), name = '', n = 0, l = elms.length; n < l; n++) {
    if (elms[n]['cr-id']) continue;
    if (inst.instance.onBeforeChildInit) inst.instance.onBeforeChildInit(elms[n]);
    name = elms[n].tagName.toLowerCase();
    isLazy = elms[n].hasAttribute('cr-lazy');
    if (!inst.crInst.options.debug && isLazy) elms[n].removeAttribute('cr-lazy');
    if (isLazy && !components[name]) {
      (function(inst, elm, name) { // lazy loading :) nice
        require([require.lazyPackages[name] || name], function(component) {
          var newInst = component.init(elm, null, inst.instance);
          if (inst.instance.onChildInit) inst.instance.onChildInit(newInst.element, newInst.instance, name);
          return component;
        });
      })(inst, elms[n], name);
      continue;
    }
    newInst = components[name].init(elms[n], null, inst.instance);
    if (inst.instance.onChildInit) inst.instance.onChildInit(newInst.element, newInst.instance, name);
  }
}

function setSubscribers(listeners, scope, destroyers, name, key) {
  if (!listeners[key]) listeners[key] = {};
  listeners[key][name] = scope;
  destroyers.push(function() { delete listeners[key][name] });
}

function initInstance(component, inst, plugData, name) {
  var ids = inst.parent && inst.parent.split(':');
  var parent = inst.parent && (instances[ids[0]][ids[1]] || {}) || {};

  return new component.Klass(inst.element, function(scope, doSubscribe) {
    if (doSubscribe !== false) doSubscribe = true;
    getAttrMap(inst.element, 'cr-input', function(type, value, element) {
      var item = value.split(/\s*=\s*/);
      var isString = item[1] && (item[1].indexOf('"') === 0 || item[1].indexOf("'") === 0);
      var value = item[1];
      var key = value || item[0];

      value = isString ? value.substring(1, value.length - 1) :
        value === 'true' ? true : value === 'false' ? false :
        // value === 'null' ? null :
        +value == value ? +value :
        undefined;

      if (hasOwnProperty.call(scope, item[0])) {
        if (value !== undefined) scope[item[0]] = value;
        else if (hasOwnProperty.call(parent.instance, key)) {
          scope[item[0]] = parent.instance[key];
          if (doSubscribe) setSubscribers(parent.listeners, scope, inst.destroyers, name, key);
        }
      }
    });
    if (!inst.crInst.options.debug) inst.element.removeAttribute('cr-input');
    // TODO: check foo="Hi, this is me" ... the comma , in getAttrMap
    return;
  }, inst.crInst);
}

// ------- model stuff

function applyModel(name, component, inst) {
  var inst = inst.instance;
  var childNodes = isArray(inst[name]) ? component.childNames[name] : null;
  var vArray = getVArrayModel(name, component, inst, childNodes);

  if (name === 'this' || !isArray(inst[name]))
    return { model: vArray, standalone: true, id: inst['cr-id'] };

  inst[name] = vArray;
  return { model: vArray, id: vArray['cr-id'] }; //.addSubscriber(name, inst)[name], // ???
}

function getVArrayModel(name, component, inst, childNodes) {
  var name$PR = name + '$PR'; // TODO: $interseptor vs $PR
  var data = {
    collector: component.template.blick.collector,
    inst: inst,
    blick: component.template.blick,
    name: name,
    childNodes: childNodes,
  };

  // console.log(name, name === 'this' ? inst : inst[name] || [])
  return VArray.adopt(name === 'this' ? inst : inst[name] || [], {
    idProperty: 'cr-id', // TODO: define by circular properties
    children: childNodes,
    listeners: component.subscribe$[name],
    error: function(error, level) {
      if (!level) throw('VArray Error: ' + error);
      else console.error('VArray Error: ' + error);
    },
    promoter: {
      interseptor: inst[name$PR] && inst[name$PR].bind(inst),
      onChange: function move(vArrData) {
        // if (vArrData.action !== 'change') console.log('onChange', vArrData);
        if (vArrData.action === 'change') vSubscribe(data, vArrData);
        // else vMoveCallback(data, vArrData);
        else vMoveCallback(vArrData.action, vArrData.item, vArrData.parent,
          vArrData.previousParent, vArrData.index, !vArrData.last, data);
      }
    }
  });
}

// TODO: return false would return the value back .... hmmmm ... no rendering...
function vSubscribe(data, vData) {
  var key = data.childNodes;
  var inst = data.inst;
  var collection = data.collector.updaters[vData.item['cr-id']];
  var updaters = collection && collection[vData.key];
  var name$ = data.name + '$';
  var ids = data.inst['__cr-id'].split(':');

  if (updaters) for (var n = updaters.length; n--; ) updaters[n](vData.value);
  if (inst[name$]) inst[name$](vData.key, vData.item, vData.value, vData.oldValue);

  inst = instances[ids[0]][ids[1]].listeners[vData.key];
  if (inst) for (key in inst) inst[key][vData.key] = vData.value;
}

function vMoveCallback(action, item, parent, previousParent, index, skipFix, data) {
  var blick = data.blick;
  var newParent = previousParent !== parent ? previousParent : parent;
  var count = parent.length;
  var name$Move = data.name + '$Move';

  if (action === 'move') {
    if (previousParent !== parent && count === 1)
      updateArrayListeners(data, item.parentNode, blick.options.loopHelperName);
    blick.moveChild(index, newParent, item.index, parent, data.childNodes, skipFix);
  } else if (action === 'add') {
    if (count === 1) checkRoot(item, parent, data);
    blick.addChild(index, parent, item);
  } else if (action === 'remove') {
    blick.removeChild(index, parent, item); // this first
    if (count === 0) checkRoot(item, parent, data);
  } else if (action === 'sort') {
    blick.moveChild(index, parent, count - 1, parent, data.childNodes, skipFix);
  }

  if (data.inst[name$Move]) data.inst[name$Move](action,
    parent.parent ? data.childNodes : data.name, item, parent, previousParent);

  // TODO: replaceChild should work like: this.tree = data; VOM.updateModel(model, newModel);
  // ... but maybe the use then should use VOM.updateModel() instead of replaceChild()
}

function checkRoot(item, parent, data) { // TODO: rename
  if (!parent.parent) data.inst[data.name] = data.inst[data.name];
  else updateArrayListeners(data, item.parentNode);
}

function updateArrayListeners(data, parent, stop) { // TODO: optimise
  var childNodes = data.childNodes; // TODO: check...
  var updaters = data.collector.updaters[parent['cr-id']][childNodes] || [];

  for (var n = updaters.length; n--; ) updaters[n](parent[childNodes], stop);
}

// ------- blick stuff

function registerLoopItem(node, item, debugMode, processed) { // TODO: uuuhhh,...
  if (processed) return;
  node['cr-id'] = item['cr-id'];
  debugMode && node.setAttribute('cr-id', item['cr-id']); // TODO: this
}

function scanHTML(blick, fragment, item, parent, index, id, deleted) {
  var inst = blick.cr_component;
  var models = inst.models;
  var itemID = item['cr-id'];
  var vArrayID = itemID && itemID.split(':')[0] || keys(models)[0];
  var vArray = models[vArrayID].model;
  var childNodes = vArray._onChange._options.children;
  var children = fragment.children;

  if (deleted === true) {
    destroyItems(fragment, inst);
    return function getChildren(sItem) { return sItem[childNodes] || [] };
  }
  if (!children.length) return; // prevents unnecessary initInnerComponents()...

  if (itemID) for (var n = children.length; n--; ) registerLoopItem( // TODO: check why...
    children[n], item, blick.options.debugMode, children[n]['cr-id']
  );

  initInnerComponents(inst, fragment);
  addInstanceEvents(inst, vArray, fragment);
}

function isDynamic(blick, obj, key, vArrayID, makeDynamic) {
  var active = obj ? (Object.getOwnPropertyDescriptor(obj, key) || {}).set ? 1 : 0 : 0;
  var models = blick.cr_component.models;
  // var itemID = obj['cr-id']; // TODO: repetitive code
  // var vArrayID = '';

  if (!active && makeDynamic && obj && hasOwnProperty.call(obj, key)) {
    // vArrayID = itemID && itemID.split(':')[0] || keys(models)[0]; // TODO: catch?
    models[vArrayID].model.addSubscriber(key, obj);
    active = 2;
  }
  return active;
}

// GOOD to go :) events go automatically
function destroyItems(fragment, inst) {
  var childNodes = fragment.childNodes;
  var items = $$(inst.template.childQuery, fragment);

  for (var n = childNodes.length; n--; ) fragment.removeChild(childNodes[n]); // cleans up garbage
  for (var n = items.length; n--; ) destroyComponent(items[n]['cr-id'], inst);
}

// -----------------

// GOOD for now (perfect with controller...)
function addInstanceEvents(inst, vArray, fragment) {
  if (!inst.template.enableEvents) return null; // TODO:  || !vom
  if (fragment) addInstanceEvents(inst, vArray); // for it self!!!
  getAttrMap(fragment || inst.element, 'cr-event', function(type, value, element) {
    var idElm = Toolbox.findParent(element, 'cr-id', inst.element);
    var id = idElm ? idElm['cr-id'] : '';
    var mainID = id.substring(0, id.indexOf(':'));
    var model = vArray && id && vArray.getElementById(id, true) || inst.instance; // TODO: check
    var parent = inst.models[mainID] && inst.models[mainID].model;
    var children = parent && parent._onChange && parent._onChange._options.children;

    inst.controller.installEvent(type, {
      idTag: 'cr-id',
      getElementById: vArray && vArray.getElementById,
      model: model,
      children: children,
      element: element,
    }, value.split(/\s*,\s*/), inst.instance);
    !inst.crInst.options.debug && element.removeAttribute('cr-event');
  });
}

// GOOD to go
function installStyles(styles, selector) {
  var innerHTML = !styles ? '' : isArray(styles) ? styles.join('\n') : styles;
  var link = innerHTML && $create('style');

  if (!link) return null;
  link.setAttribute('name', selector);
  link.innerHTML = '\n' + innerHTML + '\n';

  return document.head.appendChild(link);
}

// GOOD to go
function processSubscribers(subscribe$, children) {
  var items = keys(subscribe$);

  if (!subscribe$.this) subscribe$.this = [];
  for (var n = items.length, item = '', parts = []; n--; ) {
    item = items[n];
    parts = item.split(':');
    if (parts.length < 2) continue;
    for (var m = parts.length; m--; ) if (m > 0) {
      children[parts[m - 1]] = parts[m].replace(/\]/g, '');
    } else {
      subscribe$[parts[m]] = subscribe$[item];
      delete subscribe$[item];
    }
  }
  return children;
}

// ----------------- template...

// GOOD for now (check childComponents)
function processTemplate(template, blickOptions, skipBlick) {
  var childComponents = {};
  var componentKeys = keys(components);
  var query = componentKeys.join('|');
  // <(?:(test-2)[^/]?|[^>]+cr-name=['"]*([^"'\s]*)|([^ >]+)[^>]*cr-lazy)[^/]*?>
  var addOn = query ? '(' + query + ')[^/]?|' : '';
  var regexp = '<(?:' + addOn + '([^ >]+)[^>]*cr-lazy)[^/]*?>';
  // var regexp = '<(?:' + addOn + '[^>]+cr-name=[\'"]*([^"\'\\s]*)|([^ >]+)[^>]*cr-lazy)[^/]*?>';
  var partialKeys = !!keys(blickOptions.partials || {}); // TODO... good/save for now...

  // .replace(/(?:{{&gt;|cr-src=)/g, function($1) {
  //   return $1.charAt(0) === '{' ? '{{>' : 'src=';
  // })

  // TODO: also check imported partials the same way...
  // query && !hasPartials &&
  template.replace(new RegExp(regexp, 'g'), function(_, $1, $2, $3) {
    var out = $1 || $2 || $3;
    if (out) childComponents[out] = true; // Map like overwrite
  });

  return {
    blick: skipBlick ? null : new Blick(Toolbox.trim(template), blickOptions),
    // TODO: also check imported partials the same way...
    // childComponents: hasPartials ? componentKeys : keys(childComponents),
    childComponents: keys(childComponents),
    enableEvents: /\s+cr-event/.test(template) ||
      checkPartial(blickOptions.partials, partialKeys, /\s+cr-event/),
    enableViews: /\s+cr-view/.test(template) ||
      checkPartial(blickOptions.partials, partialKeys, /\s+cr-view/),
  };
}

function checkPartial(partials, keys, regex) { // TODO: check ... geen zin in
  for (var n = keys.length; n--; ) if (regex.test(partials[keys[n]])) return true;
  return false;
}

// GOOD for now
// TODO: extract <my>...</my> innerHTML for @content partial in addComponentPartial()
function addComponentPartial(template, content, blickOptions) {
  var partial = processTemplate(content, blickOptions, true);
  var childComponents = template.childComponents; // is []

  template.enableEvents = template.enableEvents || partial.enableEvents;
  template.enableViews = template.enableViews || partial.enableViews;
  for (var n = partial.childComponents.length; n--; ) {
    if (childComponents.indexOf(partial.childComponents[n]) !== -1) continue;
    childComponents.push(partial.childComponents[n]);
  }
  template.blick.registerPartial('@content', content);
  return '';
}

function registerPartials(crInst, component) {
  if (!crInst.controls.initPartials && component.template) crInst.controls.initPartials =
  (function(partials, blick) { // overwrite partials (cr-inst) with processed ones...
    for (var name in partials) partials[name] = blick.partials[name];
    return true;
  })(crInst.options.partials, component.template.blick);
}

function getBlickOptions(options, defData) {
  // TODO: maybe add more options...
  return {
    helpers: extend(extend({}, options.helpers), defData.helpers || {}),
    partials: extend(extend({}, options.partials), defData.partials || {}),
    attributes: extend(extend({}, options.attributes), defData.attributes || {}),
    forceUpdate: true,
    limitPartialScope: false,
    debugMode: options.debug ? 'warn' : '',
    debugLevel: options.debug,
    registerLoopItem: registerLoopItem, // could be wrapped to add arguments about inst.
    isDynamic: isDynamic, // same as above
    scanHTML: scanHTML, // same as above
  };
}

// -----------------

function getAttrMap(element, attr, fn, data) { // mixed usage...
  var start = element.hasAttribute && element.hasAttribute(attr) ? [element] : [];
  var inner = element.childNodes.length ? $$('[' + attr + ']', element) : [];
  var elements = inner.length ? (start.push.apply(start, inner), start) : start;

  var out = {};
  // TODO: check if optimisable... used a lot.
  for (var n = elements.length, attribute = '', chunks = []; n--; ) {
    attribute = elements[n].getAttribute(attr);
    chunks = attribute ? attribute.split(/\s*;+\s*/) : [];
    out[attribute] = elements[n];

    for (var m = chunks.length, item = [], type = '', value = ''; m--; ) {
      item = chunks[m].split(/\s*:+\s*/);
      type = item[0];
      value = item[1] || item[0];
      fn && fn(type, value, elements[n]);
      if (!data) continue;
      if (!value) {
        data[type] = data[type] || [];
        data[type].push(elements[n]);
      } else {
        data[type] = data[type] || {};
        data[type][value] = data[type][value] || [];
        data[type][value].push(elements[n]);
      }
    }
  }
  return data ? data : out;
}

}, 'circular');