/**! @license CircularJS v1.0.0; Copyright (C) 2019 by Peter Dematté */
define('circular', ['toolbox', 'blick', 'VOM', 'api', 'controller'],
function(Toolbox, Blick, VOM, mixinAPI, Controller) { 'use strict';

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var keys = Toolbox.keys;
var id = 0; // circular instance counter
var components = {}; // collection of blueprints
var templateWrapper = document.createElement('div');

function Circular(name, options) {
  this.options = {
    hash: '#',
    partials: {},
    helpers: {},
    decorators: {},
  };
  this.instances = {};

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
  _this.instances[_this.id] = {};
}

Object.defineProperties(Circular.prototype, mixinAPI({ // methods
  initComponents: { value: function(selector, context) {
    var selectors = selector ? [selector] : keys(components);
    var innerComponents = getInnerComponents(selectors, [], context);

    return innerComponents.filter(function(element) {
      return components[element.getAttribute('cr-component') || element.tagName.toLowerCase()]
        .init(element, context && innerComponents);
    });
  }},
}, Circular));

return Object.defineProperties(Circular, { // static
  Component: { value: function(defData, Klass) {
    return components[defData.selector] || (components[defData.selector] = {
      Klass: Klass,
      selector: defData.selector,
      templates: processTemplate(templateWrapper, defData), // TODO: defData.selector
      styles: installStyles(defData.selector, defData),
      name: defData.name || Klass.name,
      init: function init(element, innerComponents) {
        return initComponent(element, defData, Klass, innerComponents);
      },
    });
  }},
});

/* -------------------- private functions ------------------- */

function initComponent(element, defData, Klass, innerComponents) {
  var selector = defData.selector;
  var component = components[selector];
  var items = {};
  var instance = {};
  var crInst = defData.circular || Circular.instance;
  var initComponents = {};
  var controller = {};
  var models = [];
  var templates = component.templates;

  if (element.hasAttribute('cr-id')) return; // TODO: return instance?

  ['partials', 'helpers', 'decorators', 'attributes'].forEach(function(key) {
    if (!defData[key]) defData[key] = crInst.options[key];
  });

  items = {
    'cr-id': (element.setAttribute('cr-id', 'cr-' + id), id++),
    elements: { element: element },
    events: {},
    parentNode: {},
    views: {},
  };
  instance = crInst.instances[crInst.id][element.getAttribute('cr-name') || items['cr-id']] =
    new Klass(element, items.views); // TODO
  controller = new Controller({ element: element });
  models = keys(templates).concat(keys(defData.$));
  models.filter(function(item, idx) { return models.indexOf(item) === idx })
  .sort(function(a) { return a === 'this' ? -1 : 0 })
  .forEach(function(key) {
    if (!key) return;
    applyModel({ // TODO: only send ids only (instance, ...);
      instance: instance,
      items: items,
      defData: defData,
      template: templates[key] && templates[key].template,
      childTemplate: templates[key] && templates[key].child,
      templateContainer: templates[key] ?
        getPlaceHolder(element, templates[key].container + '') : element,
      modelName: key,
      listeners: defData.$ && defData.$[key],
      crInstance: crInst,
      controller: controller,
    });
  });

  element.removeAttribute('cr-cloak'); // TODO
  initComponents = function(context) {
    crInst.initComponents(null, context || element);
  };
  instance.onInit && instance.onInit(element, items, initComponents, crInst); // TODO
  defData.autoInit !== false && initComponents();

  return instance;
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

function destroyCollector(collector) {
  if (!collector) return;
  for (var item in collector) delete collector[item];
}

function resetComponent(data, vom) {
  destroyCollector(data.template && data.template.collector);
  destroyCollector(data.childTemplate && data.childTemplate.collector);
  data.templateContainer.innerHTML = '';
}

function applyModel(data) {
  var vom = getVOMInstance(data);

  if (data.modelName === 'this' || data.instance[data.modelName].constructor !== Array) return;

  for (var key in VOM.prototype) {
    Object.defineProperty(vom.model, key, { value: vom[key].bind(vom) });
  }
  Object.defineProperty(data.instance, data.modelName, {
    get: function() { return vom.model },
    set: function(newModel) { // TODO: check performance
      vom.destroy();
      resetComponent(data, vom);
      vom.__isNew = true; // TODO: check why
      newModel.forEach(function(item) { vom.appendChild(item) });
      delete vom.__isNew;
    },
  });
}

function getVOMInstance(data) {
  var instance = data.instance;
  var modelName = data.modelName;

  return data.crInstance.model(modelName === 'this' ? instance : instance[modelName] || [], {
    idProperty: 'cr-id', // TODO: optional
    moveCallback: instance[modelName + 'Move$'] || function() {},
    enrichModelCallback: instance[modelName + 'Enrich$'] || function() {},
    listeners: data.listeners,
    preRecursionCallback: function(item, type, siblPar) {
      var element = setNewItem(this, { item: item, type: type, siblPar: siblPar, data: data });

      instance[modelName + 'PreRecursion$'] &&
        instance[modelName + 'PreRecursion$'](item, element);
    },
    subscribe: function(property, item, value, oldValue, sibling) {
      var internal = this[property] && !this.hasOwnProperty(property);

      changeItem(this, property, item, value, oldValue, sibling, data);
      instance[modelName + '$'] && !internal &&
        instance[modelName + '$'](property, item, value, oldValue);
      instance[modelName + '$$'] &&
        instance[modelName + '$$'](property, item, value, oldValue, internal);
    },
  });
}

function setNewItem(vomInstance, param) {
  var item = param.item;
  var data = param.data;
  var rootElement = data.items.elements.element;
  var instContainer = data.templateContainer; // TODO: check
  var define = vomInstance.reinforceProperty;
  var isChild = !item.childNodes && !!data.childTemplate;
  var template = isChild ? data.childTemplate : data.template;
  var fragment = template && template.renderHTML(item, data.defData.extraModel);
  var parentElements = item.parentNode && item.parentNode.elements;
  var tmpParent = parentElements && parentElements.container || instContainer;
  var parent = isChild ? tmpParent.lastElementChild : tmpParent;
  var sibling = param.siblPar && param.siblPar.elements && param.siblPar.elements.element;
  var element = !fragment ? instContainer :
    render(fragment.children[0], param.type, parent, sibling);
  var container = isChild ? parent :
    element.hasAttribute('cr-mount') ? element : $('[cr-mount]', element); // TODO

  element.setAttribute('cr-id', vomInstance.id + ':' + (item['cr-id'] || 0));

  if (instContainer !== rootElement) { // TODO...
    define(item, 'elements', { element: element, container: container });
    define(item, 'views', getViewMap(element, function(elm) {
      // elm.removeAttribute('cr-view');
    }));
    define(item, 'events', getEventMap(element, function(eventName) {
      data.controller.installEvent(data.instance, rootElement, eventName);
    }));
  } else {
    data.items.views = getViewMap(element, function(elm) {
      // elm.removeAttribute('cr-view');
    });
    data.items.events = getEventMap(rootElement, function(eventName) {
      data.controller.installEvent(data.instance, rootElement, eventName, data.items);
    });
  }

  return element;
}

function changeItem(vomInstance, property, item, value, oldValue, sibling, data) {
  var element = item.elements && item.elements.element; // TODO: item.elements
  var parentElements = item.parentNode && item.parentNode.elements;
  var parentElement = parentElements ? // TODO: check again
    parentElements.container || parentElements.element : data.templateContainer;
  var id = item['cr-id'];
  var template = !item.childNodes && data.childTemplate || data.template;
  var collector = template ? template.collector : {};

  if (property === 'removeChild') {
    render(element, property, element.parentElement);
    destroyCollector(collector[id]);
    delete collector[id];
  } else if (property === 'sortChildren') {
    render(element, 'appendChild', parentElement);
  } else if (vomInstance[property]) {
    if (item === sibling) { // replaceChild by itself;
      setNewItem(vomInstance, { item: item, type: property, siblPar: sibling, data: data });
    } else if (property !== 'replaceChild' && !vomInstance.__isNew) {
      render(element, property, parentElement, sibling.elements && sibling.elements.element);
    }
  }

  blickItems(data, item, collector, id, property, value, oldValue);
}

function blickItems(data, item, collector, id, property, value, oldValue) {
  var blickItem = collector[id] && collector[id][property];

  if (!blickItem) return;

  for (var n = blickItem.length, elm; n--; ) {
    if (blickItem[n].forceUpdate || value !== oldValue) {
      elm = blickItem[n].fn(blickItem[n].parent);
      if (data.controller && elm) for (var m = elm.length; m--; ) {
        getEventMap(elm[m], function(eventName, fnName) {
          var elms = (item.events || data.items.events)[eventName];

          if (!elms) {
            elms = item.events[eventName] = {};
            data.controller.installEvent(data.instance, data.instance.element, eventName);
          }
          if (!elms[fnName]) {
            elms[fnName] = [elm[m]];
          } else {
            elms[fnName].filter(function(elm, idx) { // cleanup; lazy in controller?
              if (!data.items.elements.element.contains(elm)) elms[fnName].splice(idx, 1);
            });
            elms[fnName].push(elm[m]);
          }
          if (value !== undefined && value && data.defData.autoInit !== false) {
            data.crInstance.initComponents(); // TODO: destroy...
          }
        });
      }
    }
  }
}

function render(html, operator, parentNode, sibling) { // not optimized
  if (operator === 'prependChild') {
    operator = 'insertBefore';
    sibling = parentNode.children[0];
  } else if (operator === 'insertAfter') {
    if (sibling.nextElementSibling) {
      operator = 'insertBefore';
      sibling = sibling.nextElementSibling;
    } else {
      operator = ''; // appendChild
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

function setBlickItem(collector, name, fn, data, active, parent) {
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
  var blick = {};

  template.parentNode && template.parentNode.removeChild(template);
  template.removeAttribute('cr-for');
  template.removeAttribute('cr-child');

  blick = new Blick(template.outerHTML.replace(/(?:{{&gt;|cr-src=)/g, function($1) {
    return $1.charAt(0) === '{' ? '{{>' : 'src=';
  }), { // TODO: maybe use this.template()
    helpers: defData.helpers || {},
    decorators: defData.decorators,
    partials: defData.partials,
    attributes: defData.attributes, // DOMElement attribute fn
    registerProperty: function(name, fn, data, active, parent) {
      setBlickItem(blick.collector, name, fn, data, active, parent);
    },
  });
  blick.collector = {};

  return blick;
}

function createPlaceHolder(elm, idx) {
  var placeHolder = document.createElement('script');

  placeHolder.setAttribute('type', 'placeholder/tmpl');
  placeHolder.setAttribute('data-idx', idx);

  return elm.parentNode.replaceChild(placeHolder, elm);
}

function processTemplate(element, defData) { // TODO: check again: before instanciating
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
      fn && fn(type, func);
    }
    // elements[n].removeAttribute('cr-event');
  }

  return events;
}

function getViewMap(element, fn) {
  var start = element.hasAttribute('cr-view') ? [element] : [];
  var elements = start.concat([].slice.call($$('[cr-view]', element))); // TODO: concat
  var views = {};

  for (var n = elements.length; n--; ) { // TODO: if (!attribute)
    views[elements[n].getAttribute('cr-view')] = elements[n];
    // elements[n].removeAttribute('cr-view');
    fn && fn(elements[n]);
  }

  return views;
}

});
