/**! @license CircularJS v0.5.0; Copyright (C) 2019 by Peter Dematté */
define('circular', ['toolbox', 'blick', 'VOM', 'api', 'controller'],
  function(Toolbox, Blick, VOM, addCircularAPI, Controller) { 'use strict';

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var keys = Toolbox.keys;
var id = 0; // circular instance counter
var components = {}; // collection of blueprints
var instances = {}; // key: id; collection of instances

function Circular(name, options) {
  this.options = {
    element: 'element',
    container: 'container',
    events: 'events',
    views: 'views',
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
  _this.version = '0.5.0';
  _this.id = 'cr_' + id++;
  _this.name = isName ? name : _this.id;
  
  instances[_this.id] = {};
}

Circular.prototype = {
  initComponents: function(selector, context) {
    var selectors = selector ? [selector] : keys(components);
    var innerComponents = getInnerComponents(selectors, [], context);
    
    innerComponents.forEach(function(element) {
      components[element.getAttribute('cr-component') || element.tagName.toLowerCase()]
        .init(element, context && innerComponents);
    });
  },
};

addCircularAPI(Circular);

Circular.Component = function(defData, Klass) {
  Klass.prototype.uncloak = function(item) {
    var elm = item && item.element;

    if (!elm) return;
    Toolbox.removeClass(elm, 'cr-cloak');
    elm.removeAttribute('cr-cloak');
  };

  return components[defData.selector] = {
    Klass: Klass,
    selector: defData.selector,
    template: defData.template,
    childTemplate: null,
    HTML: null, // DOTO: this concept will die
    styles: installStyles(defData.selector, defData),
    name: defData.name || Klass.name,
    init: function init(element, innerComponents) {
      return initComponent(element, defData, Klass, innerComponents);
    },
  };
};

return Circular;

/* -------------------- private functions ------------------- */

function initComponent(element, defData, Klass, innerComponents) {
  var selector = defData.selector;
  var component = components[selector];
  var items = {};
  var instance = {};
  var crInstance = defData.circular || Circular.instance;
  var initComponents = {};
  var controller = {};
  var restoreInnerComponents = function(){};

  if (element.hasAttribute('cr-id')) return;

  ['partials', 'helpers', 'decorators'].forEach(function(key) {
    if (!defData[key]) defData[key] = crInstance.options[key];
  });

  restoreInnerComponents = removeInnerComponents(
    innerComponents || getInnerComponents(keys(components), [], element),
    element
  );
  items = getComponentItems(element, id++, component, defData);
  instance = instances[crInstance.id][items['cr-id']] =
    new Klass(element, items.elements.container, items.views, items.events);
  controller = new Controller({ element: element });
  controller.installEvents(instance, element, items.events, items);
  applyModel({ // TODO: only send ids only (instance, ...); TODO: loop through models
    instance: instance,
    items: items,
    defData: defData,
    template: items.template,
    childTemplate: component.childTemplate,
    modelName: 'model', // TODO: only for now
    crInstance: crInstance,
    controller: controller,
    component: component,
  });
  restoreInnerComponents();
  if (!instance.model.length) { // TODO: make new template... :)
    instance.container.innerHTML = component.HTML; // TODO: this will go different
  }
  // ------ end
  initComponents = function(context) {
    crInstance.initComponents(undefined, context || element);
  };
  instance.onInit && instance.onInit(instance, initComponents); // regression
  defData.autoInit && initComponents();
  instance.uncloak(instance);

  return instance;
}

/* ---------------------------------------------------------- */

function destroyCollector(collector) {
  if (!collector) return;
  for (var item in collector) delete collector[item];
}

function resetComponent(data, length) {
  destroyCollector(data.template.collector);
  destroyCollector(data.childTemplate && data.childTemplate.collector);
  data.instance.container.innerHTML = length ? '' : data.component.HTML;
}

function applyModel(data) {
  var vom = getVOMInstance(data);

  for (var key in VOM.prototype) {
    Object.defineProperty(vom.model, key, { value: vom[key].bind(vom) });
  }
  Object.defineProperty(data.instance, data.modelName, {
    get: function() { return vom.model },
    set: function(newModel) { // TODO: check performance
      vom.destroy();
      resetComponent(data, newModel.length);
      newModel.forEach(function(item) { vom.appendChild(item) });
    },
  });
}

function getVOMInstance(data) {
  var defData = data.defData;
  var instance = data.instance;

  return data.crInstance.model(instance[data.modelName] || defData.model || [], {
    idProperty: 'cr-id', // TODO: optional
    moveCallback: defData.moveCallback || function() {},
    enrichModelCallback: defData.enrichModelCallback || function() {},
    listeners: defData.listeners,
    preRecursionCallback: function(item, type, siblPar) {
      var element = setNewItem(this, { item: item, type: type, siblPar: siblPar, data: data });

      instance.preRecursionCallback && instance.preRecursionCallback.call(this, item, element);
    },
    subscribe: function(property, item, value, oldValue, sibling) {
      changeItem(this, property, item, value, oldValue, sibling, data);
      defData.subscribe && defData.subscribe.call(this, property, item, value, oldValue);
    },
  });
}

function setNewItem(vomInstance, param) { // reused in subscribe when item === sibling
  var item = param.item;
  var data = param.data;
  var instContainer = data.items.elements.container;
  var define = vomInstance.reinforceProperty;
  var isChild = !item.childNodes && !!data.childTemplate;
  var template = isChild ? data.childTemplate : data.template;
  var fragment = template && template.renderHTML(item, data.defData.extraModel);
  var parentElements = item.parentNode.elements;
  var tmpParent = parentElements && parentElements.container || instContainer;
  var parent = isChild ? tmpParent.lastElementChild : tmpParent; // TODO: lastChildElement; prepend...
  var type = instContainer.getAttribute('cr-container');
  var sibling = param.siblPar && param.siblPar.elements && param.siblPar.elements.element; // TODO: check siblPar
  var element = !fragment ? instContainer : // data.items.elements.element
    render(fragment.children[0], type && type + 'Child' || param.type, parent, sibling);
  var container = isChild ? parent :
    element.hasAttribute('cr-mount') ? element : $('[cr-mount]', element); // TODO

  element.setAttribute('cr-id', item['cr-id']);
  define(item, 'elements', { element: element, container: container });
  define(item, 'views', getViewMap(element, function(elm) {
    // elm.removeAttribute('cr-view');
  }));
  define(item, 'events', getEventMap(element, function(eventName) {
    data.controller.installEvent(data.instance, instContainer, eventName);
  }));

  return element;
}

function changeItem(vomInstance, property, item, value, oldValue, sibling, data) {
  var element = item.elements.element;
  var parentElements = item.parentNode.elements;
  var parentElement = parentElements ? // TODO: check again
    parentElements.container || parentElements.element :
    data.items.elements.container;
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
  } else if ('do magic with' === 'hasStorage') {
    // TODO: should we?
  }

  blickItems(data, item, collector, id, property, value, oldValue);
}

function blickItems(data, item, collector, id, property, value, oldValue) {
  var blickItem = collector[id] && collector[id][property];

  if (!blickItem) return;

  for (var n = blickItem.length, elm; n--; ) {
    if (blickItem[n].forceUpdate || value !== oldValue) { // TODO: %
      elm = blickItem[n].fn(blickItem[n].parent);
      if (data.controller && elm) for (var m = elm.length; m--; ) {
        getEventMap(elm[m], function(eventName, fnName) {
          var elms = item.events[eventName];

          if (!elms) {
            elms = item.events[eventName] = {};
            data.controller.installEvent(data.instance, data.instance.element, eventName);
          }
          if (!elms[fnName]) {
            elms[fnName] = [elm[m]];
          } else { // TODO: %value change prduces new DOMElement...
            elms[fnName].filter(function(elm, idx) { // cleanup; lazy in controller?
              if (!data.items.elements.element.contains(elm)) elms[fnName].splice(idx, 1);
            });
            elms[fnName].push(elm[m]);
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
  link.innerHTML = options.styles; // TODO: sourceURL
  document.head.appendChild(link);

  return link;
}

function getInnerComponents(selectors, result, context) {
  var join = selectors.join('|.//');
  var wishList = (join ? './/' + join + '|' : '') + './/*[@cr-component]';
  var elms = selectors.length ? document.evaluate(wishList,
    context || document.body, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null) : [];

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

function getTemplate(template, defData, component) {
  var blick = {};
  var parent = template && template.parentNode;

  if (!template || template.nodeType !== 1) return null;
  if (template.version) return template;

  template.parentNode && template.parentNode.removeChild(template);
  template.removeAttribute('cr-template');
  component.HTML = parent.children.length || parent.innerText ? parent.innerHTML : '';
  parent.innerHTML = ''; // TODO: move somewhere else...

  blick = new Blick(template.tagName.toLowerCase() === 'script' ? template.innerHTML :
    template.outerHTML.replace(/(?:{{&gt;|cr-src=)/g, function($1) {
      return $1.charAt(0) === '{' ? '{{>' : 'src=';
    }), {
      helpers: defData.helpers || {},
      decorators: defData.decorators,
      attributes: defData.attributes,
      partials: defData.partials,
      registerProperty: function(name, fn, data, active, parent) {
        setBlickItem(blick.collector, name, fn, data, active, parent);
      },
    }
  );
  blick.collector = {};

  return blick;
}

function extractTemplateChild(element, component, defData) { // TODO: check if good
  var template = $('[cr-template]', element);
  var child = template && $('[cr-child]', template);

  if (!child) return template;

  child.removeAttribute('cr-child');
  component.childTemplate = getTemplate(child, defData, {});

  return template;
}

function checkTemplate(element, component, defData) { // TODO: check again
  var template = {};

  if (component.HTML === null) {
    if (typeof component.template === 'string') { // TODO: check if ever string (new stuff)
      element.innerHTML += component.template;
      template = extractTemplateChild(element, component, defData);
      template = component.template = getTemplate(template, defData, component);
      // component.HTML = element.removeChild(element.lastElementChild).outerHTML;
      // console.log(component.HTML);
    } else {
      // component.HTML = '';
      template = extractTemplateChild(element, component, defData);;
      if (template) {
        template = component.template = getTemplate(template, defData, component);
      }
    }
  } else {
    template = extractTemplateChild(element, component, defData);;
    if (template) {
      template = getTemplate(template, defData, component);
    }
  }
  if (!component.template && template) {
    component.template = template;
  }

  return template || component.template;
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

function restoreInnerComponents(items, component) {
  for (var n = items.length, cache = []; n--; ) { // TODO: maybe $$('')
    var tmpElm = $('[cr-replace="' + items[n].index + '"]', component);

    if (tmpElm) {
      tmpElm.parentNode.replaceChild(items[n].element, tmpElm);
    } else {
      cache.push(items[n]);
    }
  }
  if (cache.length) restoreInnerComponents(cache, component);
}

function removeInnerComponents(elements, component) {
  var items = [].slice.call(elements).map(function(element, idx) {
    var tmpElm = document.createElement(element.tagName);
    
    element.parentNode.replaceChild(tmpElm, element);
    tmpElm.setAttribute('cr-replace', idx);

    return { index: idx, element: element };
  });

  return function() {
    restoreInnerComponents(items, component);
  }
}

function getComponentItems(element, id, component, defData) {
  return {
    elements: {
      container: $('[cr-container]', element) || element,
      element: element,
    },
    template: checkTemplate(element, component, defData),
    views: getViewMap(element),
    events: getEventMap(element),
    'cr-id': (element.setAttribute('cr-id', id), id),
  };
}

});
