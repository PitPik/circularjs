/**! @license CircularJS ● v1.0.0; Copyright (C) 2019 by Peter Dematté */
define('circular', ['toolbox', 'blick', 'VOM', 'api', 'controller'],
function(Toolbox, Blick, VOM, mixinAPI, Controller) { 'use strict';

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var isArray = Toolbox.isArray;
var keys = Toolbox.keys;
var id = 0;
var components = {};
var instances = {};
var templateWrapper = document.createElement('div');

function Circular(name, options) {
  this.options = {
    hash: '#',
    partials: {},
    helpers: {},
    decorators: {},
  };

  initCircular(this, name, options || {});
}

function initCircular(_this, name, options) {
  var isName = typeof name === 'string';

  if (!isName) {
    options = name || {};
  }
  for (var option in options) {
    _this.options[option] = options[option];
  }
  _this.version = '1.0.0';
  _this.id = 'cr_' + id++;
  _this.name = isName ? name : _this.id;
  instances[_this.id] = {};
}

Object.defineProperties(Circular.prototype, mixinAPI({
  getComponent: { value: function(name) {
    var data = instances[this.id][name];

    return data && data.instance;
  }},
  destroyComponent: { value: function(inst) {
    var id = inst['__cr-id'].split(':');
    var data = instances[id[0]][id[1]];
    var instance = data.instance;

    instance.onDestroy && instance.onDestroy();
    for (var key in instance) if ( // removes collectors, rendering, ...
      instance[key] &&
      instance.hasOwnProperty(key) &&
      isArray(instance[key])) instance[key] = [];
    data.controller.removeEvents(keys(data.controller.events));
    data.models.forEach(function(model) { model.destroy() });
    data.subscribers.forEach(function(unsubscribe) { unsubscribe() });
    for (var key in data) data[key] = null;

    delete instances[id[0]][id[1]];
  }},
  destroy: { value: function() {
    var insts = instances[this.id];

    this.destroyComponents(keys(insts).map(function(key) {
      return insts[key].instance;
    }));
  }},
}, Circular));

return Object.defineProperties(Circular, {
  Module: { value: function(defData, Klass) {
    var elm = $(defData.selector, defData.context);
    var component = Circular.Component(defData, Klass);

    return {
      component: component,
      instance: component.init(elm, null, getParentComponent(elm)),
      element: elm,
    };
  }},
  Component: { value: function(defData, Klass) {
    defData.plugins = {};
    defData.components = {};

    return components[defData.selector] || (components[defData.selector] = {
      Klass: Klass,
      selector: defData.selector,
      templates: processTemplate(templateWrapper, defData),
      styles: installStyles(defData.selector, defData),
      name: defData.name || Klass.name,
      init: function init(element, plugData, parent) {
        var elm = typeof element === 'string' ? $(element) : element;

        return initComponent(elm, defData, Klass, plugData, parent);
      },
      preparePlugin: function preparePlugin(element, pData, values) {
        var plug = pData.plugins[defData.selector] = pData.plugins[defData.selector] || {};
        var where = plug[values.where] = plug[values.where] || {};
        var model = where[values.modelName] = where[values.modelName] || [];

        model.push(values.value);
        preparePluginInTemplate(element, defData);
      },
    });
  }},
  Plugin: { value: function(defData, Klass) {
    return Circular.Component(defData, Klass);
  }},
});

/* -------------------- private functions ------------------- */

function initComponent(element, defData, Klass, plugData, parent) {
  var selector = defData.selector;
  var component = components[selector];
  var items = {};
  var name = '';
  var instance = {};
  var inst = {};
  var crInst = defData.circular || Circular.instance;
  var controller = {};
  var models = [];
  var templates = component.templates;
  var elmId = element.getAttribute('cr-id');
  var elmName = element.getAttribute('cr-name');

  if (elmId && !plugData) {
    return instances[crInst.id + ':' + elmId];
  }

  ['partials', 'helpers', 'decorators', 'attributes'].forEach(function(key) {
    if (!defData[key]) defData[key] = crInst.options[key];
  });
  items = {
    'cr-id': !plugData && (element.setAttribute('cr-id', crInst.id + ':' + id), id) || id,
    elements: { element: element },
    events: {},
    parentNode: {},
    views: {},
  };
  name = items['cr-id'];
  inst = instances[crInst.id][name] = {
    instance: {}, // for overwrite
    controller: {}, // for overwrite
    models: [], // for overwrite
    parent: '', // for overwrite
    subscribers: [],
  };
  if (elmName) { // getComponent() by name possible
    instances[crInst.id][elmName] = instances[crInst.id][name];
  }
  instance = inst.instance =
    getInstance(Klass, element, crInst, id++, plugData, defData, inst, parent);
  Object.defineProperty(instance, '__cr-id', { value: crInst.id + ':' + name });
  controller = inst.controller = new Controller({ element: element });
  models = keys(templates).concat(keys(defData.subscribe$));
  inst.models = models.filter(function(item, idx) { return models.indexOf(item) === idx })
  .sort(function(a) { return a === 'this' ? -1 : 0 })
  .map(function(key) {
    if (!key) return;
    return applyModel({
      instance: instance,
      items: items,
      defData: defData,
      template: !plugData && templates[key] && templates[key].template,
      childTemplate: !plugData && templates[key] && templates[key].child,
      templateContainer: !plugData && templates[key] ?
        getPlaceHolder(element, templates[key].container + '') : element,
      modelName: key,
      listeners: defData.subscribe$ && defData.subscribe$[key],
      crInstance: crInst,
      controller: controller,
    });
  });

  element.removeAttribute('cr-cloak');
  instance.onInit && instance.onInit(element, crInst, items);

  return instance;
}

/* -------------- scoping ------------ */

function getInstance(Klass, element, crInst, instId, plugData, defData, inst, parentComp) {
  var data = plugData || element.getAttribute('cr-input');
  var parentValues = processInput(data, inst.parent = parentComp) || {};
  var parentId = parentComp && parentComp['__cr-id'].split(':')[1];

  element.removeAttribute('cr-input');

  return new Klass(element, crInst, function(scope, subscribe) {
    for (var key in parentValues.vars) scope[key] = parentValues.vars[key];
    if (subscribe !== false) {
      for (var key in parentValues.origin) {
        if (parentValues.static[key]) continue;
        instances[crInst.id][instId].subscribers.push((function(names, key) {
          return crInst.subscribeToComponent(parentId, key, function(value) {
            scope[names[key]] = value;
          }, true);
        })(parentValues.names, key));
      }
    }
    plugData && installEvents(parentComp, scope, defData);
  }, function() { return parentComp });
}

function installEvents(parent, scope, defData) {
  var events = defData.events || {};

  for (var key in events) {
    if (!parent['pl-' + events[key]]) (function(event) {
      Object.defineProperty(parent, 'pl-' + event, { value: function(e, elm, item) {
        return scope[event](e, elm, item);
      }});
    })(events[key]);
  }
}

function processInput(input, parent) {
  var vars = input && input.split(/\s*,\s*/) || [];
  var name = [];
  var out = { vars: {}, origin: {}, names: {}, static: {} };
  var isStatic = false;
  var staticValue = '';
  var key = '';

  for (var n = vars.length; n--; ) {
    name = vars[n].split(/\s+as\s+/);
    isStatic = name[0].charAt(0) === '\'';
    staticValue = isStatic ? name[0].replace(/'/g, '') : '';
    key = staticValue || name[0];

    out.vars[name[1] || key] = staticValue || parent[key];
    out.origin[key] = staticValue || parent[key];
    out.names[key] = name[1] || key;
    out.static[key] = isStatic;
  }
  return out;
}

function getParentComponent(elm) {
  var parent = elm.closest('[cr-id|="cr_"]');
  var ids = parent && parent.getAttribute('cr-id').substr(3).split(':');
  var out = ids && instances['cr_' + ids[0]][ids[1]];

  return out && out.instance || out;
}

/* -------------- plugins ------------ */

function preparePluginInTemplate(element, defData) {
  var events = element.getAttribute('cr-event');
  var all = events ? [events] : [];

  for (var key in defData.events) {
    all.push(key + ': pl-' + defData.events[key]);
  }
  element.setAttribute('cr-event', all.join('; '));
}

function initPlugins(key, value, element, inst) {
  var self = (element.getAttribute('cr-plugin') || '').indexOf(key) !== -1;
  var elms = [].slice.call($$('[cr-plugin*="' + key + '"]', element));
  var all = self ? [element].concat(elms) : elms;

  for (var n = 0, m = all.length; n < m; n++) {
    components[key].init(all[n], value[n], inst);
    all[n].removeAttribute('cr-plugin');
  }
}

/* ---------------------------------------------------------- */

function getPlaceHolder(element, idx) {
  var placeholder = idx && element.querySelector('script[data-idx="' + idx + '"]');
  var parent = placeholder && placeholder.parentNode;

  if (placeholder) {
    parent.removeChild(placeholder);
  }

  return parent || element;
}

function applyModel(data) {
  var vom = getVOMInstance(data);

  if (data.modelName === 'this' || !isArray(data.instance[data.modelName]))
    return vom;

  for (var key in VOM.prototype) {
    Object.defineProperty(vom.model, key, { value: vom[key].bind(vom) });
  }
  Object.defineProperty(data.instance, data.modelName, {
    get: function() { return vom.model },
    set: function(newModel) {
      // window.requestAnimationFrame(function() {
        injectNewModel(vom, vom.model, newModel, newModel.isDelta);
      // });
    },
  });

  return vom;
}

function injectNewModel(vom, model, newModel, deltaOnly) {
  for (var n = 0, m = newModel.length; n < m; n++) {
    if (model[n]) {
      updateModelItem(vom, model[n], newModel[n]);
    } else { // if (!deltaOnly)
      vom.appendChild(newModel[n], model.parentNode || model[0] && model[0].parentNode);
    }
  }
  if (deltaOnly) return;
  while (model.length > newModel.length) vom.removeChild(model[model.length - 1]);
}

function updateModelItem(vom, item, newItem) {
  for (var key in newItem) {
    if (key !== 'childNodes') { //  && newItem[key] !== item[key]) { // force update
      item[key] = newItem[key];
    }
  }
  if (newItem.childNodes) {
   injectNewModel(vom, item.childNodes, newItem.childNodes);
  }
}

function getVOMInstance(data) {
  var inst = data.instance;
  var name = data.modelName;
  var name$ =  name + '$';
  var name$$ = name + '$$';
  var name$PR = name + '$PR';

  return new VOM(name === 'this' ? inst : inst[name] || [], {
    idProperty: 'cr-id',
    moveCallback: inst[name + '$Move'] || function() {},
    enrichModelCallback: inst[name + '$Enrich'] || function() {},
    listeners: data.listeners,
    preRecursionCallback: function(item, type, siblPar) {
      var element = data.template &&
        setNewItem(this, { item: item, type: type, siblPar: siblPar, data: data });

      inst[name$PR] && inst[name$PR](this, item, element);
    },
    subscribe: function(property, item, value, oldValue, sibling) {
      var intern = property === 'childNodes' || !!VOM.prototype[property];

      data.template && changeItem(this, property, item, value, oldValue, sibling, data);
      inst[name$] &&  !intern && inst[name$](property, item, value, oldValue);
      inst[name$$] && inst[name$$](property, item, value, oldValue, intern);
      !intern && data.crInstance.publish(data.crInstance.id, inst['__cr-id'], property, value);
    },
  });
}

function getHelperData(item) {
  var parent = item.parentNode;
  var index = item.index;
  var isLast = parent && parent.childNodes.length - 1 === item.index;
  var isFirst = index === 0;

  return parent ? {
    '@last': isLast,
    '@first': isFirst,
    '@index': index,
    '@counter': index + 1,
  } : {};
}

function setNewItem(vomInstance, param) {
  var item = param.item;
  var data = param.data;
  var rootElement = data.items.elements.element;
  var instContainer = data.templateContainer;
  var define = vomInstance.reinforceProperty;
  var isChild = !item.childNodes && !!data.childTemplate;
  var template = isChild ? data.childTemplate : data.template;
  var extraModel = (data.defData.extraModel || []).concat(getHelperData(item));
  var fragment = template && template.renderHTML(item, extraModel);
  var parentElements = item.parentNode && item.parentNode.elements;
  var tmpParent = parentElements && parentElements.container || instContainer;
  var parent = isChild ? tmpParent.lastElementChild : tmpParent;
  var sibling = param.siblPar && param.siblPar.elements && param.siblPar.elements.element;
  var isNew = item.__index !== undefined && !item.childNodes;
  var element = !fragment ? instContainer : !isNew ?
    render(fragment.children[0], param.type, parent, sibling, true) : fragment.children[0];
  var container = isChild ? parent :
    element.hasAttribute('cr-mount') ? element : $('[cr-mount]', element);

  if (!element.hasAttribute('cr-id')) {
    element.setAttribute('cr-id', vomInstance.id + ':' + (item['cr-id'] || 0));
  }
  if (instContainer !== rootElement) {
    define(item, 'elements', { element: element, container: container });
    define(item, 'views', getViewMap(element, function(elm) {}));
    define(item, 'events', getAttrMap(element, 'cr-event', function(eventName) {
      data.controller.installEvent(data.instance, rootElement, eventName);
    }));
  } else {
    data.items.views = getViewMap(element, function(elm) {});
    data.items.events = getAttrMap(rootElement, 'cr-event', function(eventName) {
      data.controller.installEvent(data.instance, rootElement, eventName, data.items);
    });
  }
  initComponentsAndPlugins(element, data.defData, data.modelName, isChild, data.instance);

  return element;
}

function initComponentsAndPlugins(element, defData, modelName, isChild, instance) {
  var componentsDefs = defData.components;
  var plugins = defData.plugins;
  var isMain = modelName === 'this';
  var isLoop = !isMain && !isChild;
  var what = isMain ? 'main' : isLoop ? 'loop' : isChild ? 'child' : '';
  var insts = [];
  // components
  for (var key in componentsDefs) {
    if (what && componentsDefs[key][what][modelName]) {
      [].slice.call($$(key, element)).forEach(function(elm) {
        insts.push(components[key].init(elm, null, instance));
      });
    }
  }
  // plugins
  for (var key in plugins) {
    if (what && plugins[key][what] && plugins[key][what][modelName]) {
      initPlugins(key, plugins[key][what][modelName], element, instance);
    }
  }
  return insts;
}

function changeItem(vomInstance, property, item, value, oldValue, sibling, data) {
  var element = item.elements && item.elements.element; 
  var parentElements = item.parentNode && item.parentNode.elements || null;
  var parentElement = parentElements ? // TODO: check again
    parentElements.container || parentElements.element : data.templateContainer;
  var id = item['cr-id'];
  var template = !item.childNodes && data.childTemplate || data.template || null;
  var collector = template ? template.collector : {};
  var intern = property === 'childNodes' || !!VOM.prototype[property];

  if (property === 'removeChild') {
    render(element, property, element.parentElement);
    destroyCollector(collector, id);
  } else if (property === 'sortChildren') {
    render(element, 'appendChild', parentElement);
  } else if (vomInstance[property]) {
    if (item === sibling) { // replaceChild by itself;
      setNewItem(vomInstance, { item: item, type: property, siblPar: sibling, data: data });
    } else if (property !== 'replaceChild' && element && intern) {
      render(element, property, parentElement, sibling.elements && sibling.elements.element);
    }
  }

  blickItems(data, item, collector, id, property, value, oldValue);
  for (var key in data.defData.helpers) {
    blickItems(data, item, collector, id, key, value, oldValue);
  }
}

function destroyCollector(collector, id, keep) {
  if (!collector[id]) return;
  for (var item in collector[id]) delete collector[id][item];
  if (!keep) delete collector[id];
}

function blickItems(data, item, collector, id, property, value, oldValue) {
  var blickItems = collector[id] && collector[id][property];
  var blickItem = {};
  var components = {};

  if (!blickItems) return;

  for (var n = blickItems.length, elm; n--; ) {
    blickItem = blickItems[n];
    components = blickItem.components;

    if (value === oldValue && !blickItem.forceUpdate) continue;

    elm = blickItem.fn(blickItem.parent);
    if (data.controller && elm) for (var m = elm.length; m--; ) {
      getAttrMap(elm[m], 'cr-event', function(eventName, fnName) {
        var elms = (item.events || data.items.events)[eventName];

        if (!elms) {
          elms = item.events[eventName] = {};
          data.controller.installEvent(data.instance, data.instance.element, eventName);
        }
        if (!elms[fnName]) {
          elms[fnName] = [elm[m]];
        } else {
          elms[fnName].filter(function(elm, idx) {
            if (!data.items.elements.element.contains(elm)) {
              elms[fnName].splice(idx, 1);
            }
          });
          elms[fnName].push(elm[m]);
        }
      });
    }
    if (components) {
      data.crInstance.destroyComponents(components);
      blickItem.components = null;
    }
    if (elm && elm.length && data.defData.autoInit !== false) {
      for (var x = 0, y = elm.length; x < y; x++) {
        blickItem.components = initComponentsAndPlugins(
          elm[x].parentNode, // TODO: not parentNode...
          data.defData,
          data.modelName,
          false, // TODO: isChild,
          data.instance
        );
      }
    } 
  }
}

function render(html, operator, parentNode, sibling, created) { // TODO: created
  if (operator === 'prependChild') {
    operator = 'insertBefore';
    sibling = parentNode.children[0];
  } else if (operator === 'insertAfter') {
    if (sibling.nextElementSibling) {
      operator = 'insertBefore';
      sibling = sibling.nextElementSibling;
    } else {
      operator = '';
    }
  }
  parentNode[operator || 'appendChild'](html, sibling);

  return html;
}

function installStyles(selector, options) {
  if (!options.styles) return;

  var link = document.createElement('style');
  link.setAttribute('name', selector);
  link.innerHTML = '\n' + options.styles + '\n'; // TODO: sourceURL
  document.head.appendChild(link);

  return link;
}

function getInnerComponents(selectors, result, context, fn) {
  var join = selectors.join('|.//');
  var wishList = (join ? './/' + join + '|' : '') + './/*[@cr-component]';
  var elms = selectors.length ? document.evaluate(wishList,
    context || document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null) : [];

  for (var n = elms.snapshotLength, item = {}; n--; ) {
    item = elms.snapshotItem(n);
    result.push(item);
    if (fn) fn(item, item.tagName.toLowerCase());
  }

  return result;
}

function registerBlickProperty(name, fn, data, active, parent, foundNode, collector) {
  var noGetter = parent && data[parent[0]] &&
    !Object.getOwnPropertyDescriptor(data[parent[0]], '0').get;
  var _parent = parent ? parent.slice(0) : parent;
  var blickItem = collector[data['cr-id']] = collector[data['cr-id']] || {};
  var _name = '';

  parent && noGetter && _parent.push(name);
  _name = _parent && _parent.join('.') || name;

  blickItem[_name] = blickItem[_name] || [];
  blickItem[_name].push({
    fn: fn,
    forceUpdate: active === 2,
    parent: parent && (name !== 'this' && name !== '.' ?
      parent.concat(name.split('.')) : parent),
  });
}

function getTemplate(template, defData, where, modelName) {
  if (!template) return null;
  template.parentNode && template.parentNode.removeChild(template);
  template.removeAttribute('cr-for');
  template.removeAttribute('cr-child');

  getAttrMap(template, 'cr-plugin', function(key, value, element) {
    components[key] && components[key].preparePlugin(element, defData, {
      where: where,
      modelName: modelName,
      value: value,
    });
  });

  getInnerComponents(keys(components), [], template, function(element, key) {
    var component = defData.components[key] = defData.components[key] ||
      { main: {}, loop: {}, child: {} };

    component[where][modelName] = true;
  });

  return new Blick(template.outerHTML.replace(/(?:{{&gt;|cr-src=)/g, function($1) {
    return $1.charAt(0) === '{' ? '{{>' : 'src=';
  }), {
    helpers: defData.helpers || {},
    decorators: defData.decorators,
    partials: defData.partials,
    attributes: defData.attributes,
    registerProperty: registerBlickProperty,
  });
}


function processTemplate(element, defData) {
  var _ = element.innerHTML = defData.template; // TODO: fragment...
  var templates = element.querySelectorAll('[cr-for]');
  var result = {};

  templates.forEach(function(elm, idx) {
    var child = $('[cr-child]', elm);
    var modelName = elm.getAttribute('cr-for');

    result[modelName] = {
      container: idx,
      child: child ? getTemplate(child, defData, 'child', modelName) : null,
      template: getTemplate(createPlaceHolder(elm, idx), defData, 'loop', modelName),
    };
  });

  result['this'] = {
    template: getTemplate(element.firstElementChild, defData, 'main', 'this'),
  };

  return result;
}

function createPlaceHolder(elm, idx) {
  var placeHolder = document.createElement('script'); // TODO: match to parent

  placeHolder.setAttribute('type', 'placeholder/tmpl');
  placeHolder.setAttribute('data-idx', idx);

  return elm.parentNode.replaceChild(placeHolder, elm);
}

function getAttrMap(element, attr, fn) {
  var data = {};
  var elements = [element].concat([].slice.call($$('[' + attr + ']', element)));

  for (var n = elements.length, attribute = '', chunks = []; n--; ) {
    attribute = elements[n].getAttribute(attr);
    chunks = attribute ? attribute.split(/\s*;+\s*/) : [];
 
    for (var m = chunks.length, item = [], type = '', value = ''; m--; ) {
      item = chunks[m].split(/\s*:+\s*/);
      type = item[0];
      value = item[1];
      if (!value) {
        data[type] = data[type] || [];
        data[type].push(elements[n]);
      } else {
        data[type] = data[type] || {};
        data[type][value] = data[type][value] || [];
        data[type][value].push(elements[n]);
      }
      fn && fn(type, value, elements[n]);
    }
    // elements[n].removeAttribute('cr-event');
  }

  return data;
}

function getViewMap(element, fn) {
  var start = element.hasAttribute('cr-view') ? [element] : [];
  var elements = start.concat([].slice.call($$('[cr-view]', element)));
  var views = {};

  for (var n = elements.length; n--; ) {
    views[elements[n].getAttribute('cr-view')] = elements[n];
    // elements[n].removeAttribute('cr-view');
    fn && fn(elements[n]);
  }

  return views;
}

});
