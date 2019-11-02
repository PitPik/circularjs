/**! @license CircularJS v1.0.0; Copyright (C) 2019 by Peter Dematté */
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
  initComponents: { value: function(selector, context) {
    var selectors = selector ? [selector] : keys(components);
    var innerComponents = getInnerComponents(selectors, [], context);

    return innerComponents.map(function(element) {
      return components[
        element.getAttribute('cr-component') || element.tagName.toLowerCase()
      ].init(element, context && innerComponents);
    }).filter(function(element) { return element });
  }},
  destroyComponents: { value: function(insts) {
    insts.forEach(function(inst) {
      var id = inst['__cr-id'].split(':'); // TODO: __cr-id
      var data = instances[id[0]][id[1]];
      var instance = data.instance;

      for (var key in instance) if ( // removes collectors and rendering
        instance[key] &&
        instance.hasOwnProperty(key) &&
        isArray(instance[key])) instance[key] = [];
      data.controller.removeEvents(keys(data.controller.events));
      data.models.forEach(function(model) { model.destroy() });
      for (var key in data) data[key] = null;

      delete instances[id[0]][id[1]];
    });
  }},
  getComponent: { value: function(name) {
    var data = instances[this.id][name];

    return data.instance;
  }},
  destroy: { value: function() {
    var insts = instances[this.id];

    this.destroyComponents(keys(insts).map(function(key) {
      return insts[key].instance;
    }));
  }},
}, Circular));

return Object.defineProperties(Circular, {
  Component: { value: function(defData, Klass) {
    return components[defData.selector] || (components[defData.selector] = {
      Klass: Klass,
      selector: defData.selector,
      templates: processTemplate(templateWrapper, defData),
      styles: installStyles(defData.selector, defData),
      name: defData.name || Klass.name,
      init: function init(element, innerComponents) {
        var elm = typeof element === 'string' ? $(element) : element;

        return initComponent(elm, defData, Klass, innerComponents);
      },
    });
  }},
});

/* -------------------- private functions ------------------- */

function initComponent(element, defData, Klass, innerComponents) {
  var selector = defData.selector;
  var component = components[selector];
  var items = {};
  var name = '';
  var instance = {};
  var crInst = defData.circular || Circular.instance;
  var initComponents = {};
  var controller = {};
  var models = [];
  var templates = component.templates;
  var elmId = element.getAttribute('cr-id');

  if (elmId) {
    return instances[crInst.id + ':' + (element.getAttribute('cr-name') || elmId)];
  }

  ['partials', 'helpers', 'decorators', 'attributes'].forEach(function(key) {
    if (!defData[key]) defData[key] = crInst.options[key];
  });

  items = {
    'cr-id': (element.setAttribute('cr-id', 'cr-' + id), id),
    elements: { element: element },
    events: {},
    parentNode: {},
    views: {},
  };
  name = element.getAttribute('cr-name') || items['cr-id'];
  instance = new Klass(element, crInst);
  controller = new Controller({ element: element });
  models = keys(templates).concat(keys(defData.subscribe$));
  models = models.filter(function(item, idx) { return models.indexOf(item) === idx })
  .sort(function(a) { return a === 'this' ? -1 : 0 })
  .map(function(key) {
    if (!key) return;
    return applyModel({ // TODO: only send ids only (instance, ...);
      instance: instance,
      items: items,
      defData: defData,
      template: templates[key] && templates[key].template,
      childTemplate: templates[key] && templates[key].child,
      templateContainer: templates[key] ?
        getPlaceHolder(element, templates[key].container + '') : element,
      modelName: key,
      listeners: defData.subscribe$ && defData.subscribe$[key],
      crInstance: crInst,
      controller: controller,
    });
  });
  instances[crInst.id][name] = {
    instance: instance,
    controller: controller,
    models: models,
  };

  element.removeAttribute('cr-cloak');
  Object.defineProperty(instance, '__cr-id', { value: crInst.id + ':' + name });
  initComponents = function(context) {
    crInst.initComponents(null, context || element);
  };
  instance.onInit && instance.onInit(element, items, initComponents, crInst);
  defData.autoInit !== false && initComponents();

  return id++, instance;
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
        injectNewModel(vom, vom.model, newModel, newModel.isDelta); // TODO: document
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
      var element = setNewItem(this, { item: item, type: type, siblPar: siblPar, data: data });

      inst[name$PR] && inst[name$PR](this, item, element);
    },
    subscribe: function(property, item, value, oldValue, sibling) {
      changeItem(this, property, item, value, oldValue, sibling, data);
      inst[name$] && !VOM.prototype[property] && inst[name$](property, item, value, oldValue);
      inst[name$$] && inst[name$$](property, item, value, oldValue, !!VOM.prototype[property]);
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
  var element = !fragment ? instContainer :
    render(fragment.children[0], param.type, parent, sibling, true);
  var container = isChild ? parent :
    element.hasAttribute('cr-mount') ? element : $('[cr-mount]', element);

  element.setAttribute('cr-id', vomInstance.id + ':' + (item['cr-id'] || 0));

  if (instContainer !== rootElement) {
    define(item, 'elements', { element: element, container: container });
    define(item, 'views', getViewMap(element, function(elm) {}));
    define(item, 'events', getEventMap(element, function(eventName) {
      data.controller.installEvent(data.instance, rootElement, eventName);
    }));
  } else {
    data.items.views = getViewMap(element, function(elm) {});
    data.items.events = getEventMap(rootElement, function(eventName) {
      data.controller.installEvent(data.instance, rootElement, eventName, data.items);
    });
  }

  return element;
}

function changeItem(vomInstance, property, item, value, oldValue, sibling, data) {
  var element = item.elements && item.elements.element; 
  var parentElements = item.parentNode && item.parentNode.elements || null;
  var parentElement = parentElements ? // TODO: check again
    parentElements.container || parentElements.element : data.templateContainer;
  var id = item['cr-id'];
  var template = !item.childNodes && data.childTemplate || data.template || null;
  var collector = template ? template.collector : {};

  if (property === 'removeChild') {
    render(element, property, element.parentElement);
    destroyCollector(collector, id);
  } else if (property === 'sortChildren') {
    render(element, 'appendChild', parentElement);
  } else if (vomInstance[property]) {
    if (item === sibling) { // replaceChild by itself;
      setNewItem(vomInstance, { item: item, type: property, siblPar: sibling, data: data });
    } else if (property !== 'replaceChild' && element) {
      render(element, property, parentElement, sibling.elements && sibling.elements.element);
    }
  }

  blickItems(data, item, collector, id, property, value, oldValue);
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
      getEventMap(elm[m], function(eventName, fnName, element) {
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
          elms[fnName].push(element);
        }
      });
    }
    if (components) {
      data.crInstance.destroyComponents(components);
      blickItem.components = null;
    }
    if (elm && data.defData.autoInit !== false) {
      components = data.crInstance.initComponents();
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

function getInnerComponents(selectors, result, context) {
  var join = selectors.join('|.//');
  var wishList = (join ? './/' + join + '|' : '') + './/*[@cr-component]';
  var elms = selectors.length ? document.evaluate(wishList,
    context || document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null) : [];

  for (var n = elms.snapshotLength; n--; ) result.push(elms.snapshotItem(n));

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

function getTemplate(template, defData) {
  template.parentNode && template.parentNode.removeChild(template);
  template.removeAttribute('cr-for');
  template.removeAttribute('cr-child');

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

function createPlaceHolder(elm, idx) {
  var placeHolder = document.createElement('script'); // TODO: match to parent

  placeHolder.setAttribute('type', 'placeholder/tmpl');
  placeHolder.setAttribute('data-idx', idx);

  return elm.parentNode.replaceChild(placeHolder, elm);
}

function processTemplate(element, defData) {
  var _ = element.innerHTML = defData.template;
  var templates = element.querySelectorAll('[cr-for]');
  var result = {};

  templates.forEach(function(elm, idx) {
    var child = $('[cr-child]', elm);
    var modelName = elm.getAttribute('cr-for');

    result[modelName] = {
      container: idx,
      child: child ? getTemplate(child, defData) : null,
      template: getTemplate(createPlaceHolder(elm, idx), defData),
    };
  });

  result['this'] = { template: getTemplate(element.firstElementChild, defData) };

  return result;
}

function getEventMap(element, fn) {
  var events = {};
  var elements = [element].concat([].slice.call($$('[cr-event]', element)));

  for (var n = elements.length, attribute = '', chunks = []; n--; ) {
    attribute = elements[n].getAttribute('cr-event');
    chunks = attribute ? attribute.split(/\s*;+\s*/) : [];
 
    for (var m = chunks.length, item = [], type = '', func = ''; m--; ) {
      item = chunks[m].split(/\s*:+\s*/);
      type = item[0];
      func = item[1];
      events[type] = events[type] || {};
      events[type][func] = events[type][func] || [];
      events[type][func].push(elements[n]);
      fn && fn(type, func, element);
    }
    // elements[n].removeAttribute('cr-event');
  }

  return events;
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
