/**! @license blick v0.0.1; Copyright (C) 2018 by Peter Dematté */
(function defineBlick(root, factory) {
  if (typeof exports === 'object') module.exports = factory(root, require('schnauzer'));
  else if (typeof define === 'function' && define.amd) define('blick', ['schnauzer'],
    function (Schnauzer) { return factory(root, Schnauzer); });
  else root.Blick = factory(root, root.Schnauzer);
}(this, function BlickFactory(root, Schnauzer, undefined) { 'use strict';

function parseHtml(tags, search) {
  for (var tag in tags) tags[tag] = document.createElement(tags[tag]);
  parseHtml = function(html) {
    var tag = ((html || '').match(search) || [])[1];
    var helper = (tags[tag] || tags['_default']);

    helper.innerHTML = html || '';
    return helper;
  }
}
parseHtml({
  option: 'select',
  legend: 'fieldset',
  area: 'map',
  param: 'object',
  thead: 'table',
  tr: 'tbody',
  col: 'colgroup',
  td: 'tr',
  '_default': 'div',
}, /<\s*(\w*)\s*[\s\S]*?>/);


var Blick = function(template, options) {
    this.version = '0.0.1';
    this.options = {
      registerProperty: dummy,
      unregisterProperty: dummy,
      attributes: {
        value: updateValue,
        disabled: disableAttribute,
        checked: disableAttribute,
        autocomplete: disableAttribute,
        contenteditable: disableAttribute,
        readonly: disableAttribute,
        required: disableAttribute,
        selected: disableAttribute, // and many more
      },
    };
    init(this, options || {}, template);
  },
  init = function(_this, options, template) {
    for (var option in options) {
      if (option === 'attributes') {
        for (var attr in options[option]) {
          _this.options[option][attr] = options[option][attr];
        }
      } else {
        _this.options[option] = options[option];
      }
    }
    var registerProperty = _this.options.registerProperty;
    _this.options.registerProperty = function(part, foundNode) {
      registerProperty(part.name, part.replacer, part.data.path[0],
        part.isActive, part.parent, foundNode, _this.collector);
    };
    options.render = renderHook;
    _this.search = /{{#\d+}}[\S\s]*{{\/\d+}}/;
    _this.attrSplitter = /([^}{]*)({{#(\d+)}}[\s\S]*?{{\/\d+}})/g;
    _this.schnauzer = new Schnauzer(template, options);
    _this.collector = {}; // external map
  },
  dump = [],
  dummy = function(){},
  disableAttribute = function(element, name, value) {
    if (value === true || value === 'true' || (!value && value !== false)) {
      element.setAttribute(name, '');
      element[name] = true;
    } else {
      element.removeAttribute(name);
      element[name] = false;
      if (value === 'focus') {
        element.focus();
      }
    }
  },
  updateValue = function(element, name, value) {
    element.setAttribute('value', value);
    element.value = value;
  };

Blick.prototype = {
  render: function(data, extra) {
    return this.schnauzer.render(data, extra);
  },
  renderHTML: function(data, extra) {
    var fragment = document.createDocumentFragment();
    var html = this.schnauzer.render(data, extra);

    return resolveReferences(this, dump, html, null, fragment);
  }
};

return Blick;

function findNode(container, pattern) {
  return document.evaluate('//text()[contains(., "' + pattern + '")]',
      container, null, XPathResult.FIRST_ORDERED_NODE_TYPE , null).singleNodeValue ||
    document.evaluate('//@*[contains(., "' + pattern + '")]',
      container, null, XPathResult.FIRST_ORDERED_NODE_TYPE , null).singleNodeValue;
}

function renderHook(data) {
  var index = dump.length;

  if (!data.fn || !data.name || !data.isActive || data.partial ||
      // data.type === 'decorator' || data.type === 'helper' ||
      data.name.charAt(0) === '@') {
    return data.text + data.value;
  }
  data.isSection = checkSection(data);
  dump[index] = data;
  return data.text + '{{#' + index + '}}' + data.value + '{{/'+ index +'}}';
}

function textNodeSplitter(node, first, last) {
  node.splitText(node.textContent.lastIndexOf(last) + last.length).textContent;
  return node.splitText(node.textContent.indexOf(first));
}

function checkSection(part, node) {
  return part.section && (!part.type || part.type === 'helper' || part.type === 'decorator') &&
    (part.value.indexOf('{{#') !== -1 || (node && node.textContent.indexOf('{{#') !== -1));
}

function clearMemory(array) { // TODO: check for better
  var a = true;
  var keep = { replacer: a, lastNode: a, fn: a, children: a, unregister: a, data: a };

  for (var n = array.length; n--; ) {
    for (var key in array[n]) if (!keep[key]) delete array[n][key];
    array[n] = null;
  }
  return null;
}

function render(container, helperContainer, fragment) {
  while (helperContainer.childNodes.length) {
     fragment.appendChild(helperContainer.childNodes[0]);
  }
  if (container) { // internal only
    // if (fragment.childNodes[0].getAttribute('cr-mount') === 'parent') {
    //   fragment.removeChild(fragment.childNodes[0]);
    // }
    container.parentNode.insertBefore(fragment, container.nextSibling);
  } else {
    return fragment;
  }
}

function checkSectionChild(node, child, sections, options) {
  if (node && sections.length !== 0) {
    for (var n = sections.length; n--; ) {
      sections[n].children.push({
        unregister: (function(item) {
          return function unregister() {
            options.unregisterProperty(item.name, item);
          }
        })(child)
      });
      if (node.textContent.indexOf(sections[n].search) !== -1) {
        node.textContent = node.textContent.replace(sections[n].search, '');
        sections.pop(); //splice(n, 1);
      }
    }
  }
  return sections;
}

function getDifference(a, b) {
  var i = 0, j = 0, result = '';

  while (j < b.length) {
    if (a[i] !== b[j] || i === a.length) {
      result += b[j];
    } else {
      i++;
    }
    j++;
  }
  return result;
}

function resolveReferences(_this, memory, html, container, fragment) {
  var search = _this.search;
  var helperContainer = parseHtml(html);
  var first = '';
  var last = '';
  var part = {};
  var foundNode = {};
  var lastNode = {};
  var options = _this.options;
  var registerProperty = options.registerProperty;
  var original = '';
  var newMemory = [];
  var openSections = [];
  var out;
  var valueSplitter = {};

  for (var n = memory.length; n--; ) { // must revers
    first = '{{#' + n + '}}';
    last = '{{/' + n + '}}';
    part = memory[n];
    foundNode = findNode(helperContainer, first);

    if (!foundNode) { // error
      window.console && console.warn('There might be an error in the SCHNAUZER template');
    } else if (foundNode.ownerElement) { // attribute
      if (!foundNode.valueSplitter) { // create array of "text nodes"
        valueSplitter = foundNode.valueSplitter = [];
        valueSplitter.valueTracker = {};
        valueSplitter.push(foundNode.textContent.replace(_this.attrSplitter,
          function(_, $1, $2, $3) {
            valueSplitter.push($1);
            valueSplitter.push($2);
            valueSplitter.valueTracker[$3] = valueSplitter.length - 1;
            return '';
          }));
      }
      part.replacer = (function(elm, ownerElement, name, search, orig, item, _n) { // TODO: no part.replacer...
        return function updateAttribute(keys, _value) {
          var value = _value || item.fn(item.data, keys);
          if (value === undefined) value = '';
          if (options.attributes[name]) {
            elm = null;
            options.attributes[name](ownerElement, name, value);
          } else if (value !== undefined) {
            var oldValue = elm.valueSplitter.join('').trim();
            var diff = [];
            var newValue = '';
            if (oldValue !== elm.textContent) { // TODO: check for whitespaces??
              newValue = elm.textContent.split(oldValue)[1] || '';
              diff = getDifference(elm.textContent, oldValue);
              diff = diff && diff.split(/\s+/); // TODO: do this in getDifference
            }
            elm.valueSplitter[elm.valueSplitter.valueTracker[_n]] = value;
            var outValue = elm.valueSplitter.join('').trim() + newValue;
            for (var m = diff.length; m--; ) {
              if (diff[m]) outValue = outValue.replace(diff[m], '');
            }
            elm.textContent = outValue;
          }
        }
      })(foundNode, foundNode.ownerElement, foundNode.name, search, foundNode.textContent, part, n);
      registerProperty(part, foundNode);
      openSections = checkSectionChild(foundNode.ownerElement.previousSibling,
          part, openSections, options);
      part.replacer(null, part.value);
    } else if (!checkSection(part, foundNode)) { // inline var - inline section
      foundNode = textNodeSplitter(foundNode, first, last);
      part.replacer = (function(elm, item) {
        return function updateTextNode(keys) {
          elm.textContent = item.fn(item.data, keys);
        }
      })(foundNode, part);
      foundNode.textContent = part.value;
      registerProperty(part, foundNode);
      openSections = checkSectionChild(foundNode, part, openSections, options);
    } else { // section
      openSections = checkSectionChild(foundNode, part, openSections, options);
      openSections.push({ search: first, children: part.children = [] });
      lastNode = findNode(foundNode.parentNode, last);
      part.lastNode = lastNode = lastNode.splitText(lastNode.textContent.lastIndexOf(last));
      lastNode.textContent = lastNode.textContent.replace(last, '');
      foundNode = foundNode.splitText(foundNode.textContent.indexOf(first));
      foundNode.textContent = foundNode.textContent.replace(first, '');
      part.replacer = (function(elm, item) {
        return function updateSection(keys) {
          while (item.lastNode.previousSibling && item.lastNode.previousSibling !== elm) {
            elm.parentNode.removeChild(item.lastNode.previousSibling);
          }
          if (item.children) for (var n = item.children.length; n--; ) {
            item.children[n].unregister();
          }
          elm.textContent = '';
          newMemory = resolveReferences(_this, dump, item.fn(item.data, keys), elm, fragment);
          item.children = clearMemory(newMemory); // possible new children to be deleted...

          var collector = [];
          var node = item.lastNode;
          while (node !== elm && (node = node.previousSibling)) {
            if (node.nodeType === 1) {
              collector.push(node);
            }
          }
          return collector;
        }
      })(foundNode, part);
      registerProperty(part, foundNode);
    }
  }

  out = render(container, helperContainer, fragment); // todo
  if (!container) memory = clearMemory(memory);
  dump = [];
  return container ? memory : out;
}
}));
