# CircularJS API

Work in progress. This is just a collection of thoughts taht will hopefully soon be finished.

## amd

### define

```define``` and ```require``` are on the global scope (window). Those are the only ones though produced by CircularJS. From there on everything is handled through factories of amd.js.

amd.js is a JavaScript file and module loader. Using a modular script loader like amd.js will improve the speed and quality of your code.
amd.js works almost like requireJS, so probably nothing new for you.
There are some features though that make amd.js even faster: "lookahead" that can be specified in your setup so when requiring a module the loader already knows about it's dependencies (which then knows about even those dependencies, and so on) so you can download all pependencies in parallel.
```js
define('module-name', ['dependency-01', 'dependency-02'], function(dep1, dep2) {
    // do something with dep1 and dep2
}
```
Calling ```define()``` without a name as first argument ends up as being called with ```require()```.

Assume you have the following folder structure:

```
index.html
  |_ js/
  |   |_ deps1.js
  |      deps1.min.js
  |      deps2.js
  |_ modules/
      |_ module3/
      |   |_ index.html
      |   |_ js/
      |       |_dep.js
      |_ module4/
          |_ index.html
          |_ js/
              |_dep.js
```

### require

```js
require(['dependency-01', 'dependency-02'], function(dep1, dep2) {
    // do something with dep1 and dep2
}
```

### require.config

```
require = window.require || {
    baseUrl: '',
    lookaheadMap: {
        'dependency-01': ['dependency-03', 'dependency-04'],
    },
    paths: {
        'dependency-01': 'js/deps1.min',
        'dependency-02': 'js/deps2',
        'dependency-03': 'modules/module3/js/dep',
        'dependency-04': 'modules/module4/js/dep',
   },
    options: {
        minifyPrefix: '.min',
        debug: false
    }
};
```

## Circular

### component

```js
Circular.component(name: 'String', parameters: Object {
	model: Array [],
	extraModel: Object {} || Array [],
	subscribe: function(property, item, value, oldValue, type),
	listeners: Array [String 'modelItem', '*', ...],
	eventListeners: Object {String 'name': function(), ...},
	componentElement: Object DOMElement,
	componentWrapper: Object DOMElement,
	mountSelector: Object DOMElement,

	template: Object SchnauzerTemplate || String 'name'
	helpers: Object {String 'name': function()}

	preRecursionCallback: function()
	enrichModelCallback: function()
})
```

```component()``` initializes a named module and renders it right away if the model is set properly. Setting up a module assumes to have a HTML-tag set in you document that has an argument ```cr-componen=""``` with the value of your component's name (names are like IDs, so last of same name would overwrite privous one). Inside the module on your page you can use Schnauzer.js (works almost as Handlebars) for template rendering to reflect the model accordingly. Let's look at a simple "Hello world!" example:

```HTML
<div cr-component="hello-world" cr-container></div>
<script type="text/template" cr-template-for="hello-world">
    <span>Hello {{name}}!</span>
</script>
```

```js
var helloWorld = new Circular().component('hello-world', {
    model: [{
        name: 'World'
    }]
});
```

So, here we have set up a ```<div>``` with the declaration of its name and a hint that it is also the container for the rendering done with ```cr-container```.
The template is defined in the script tag (there are other ways to do that) where ```cr-template-for="hello-world``` explains where the template belongs to. Not that templates require one root element. This is due to performance reasons.
Inside the template you see just regular Handlebars like syntax.
The outcome will be as expected:

```HTML
<div cr-component="hello-world" cr-container>
    <span>Hello World!</span>
</div>
```

Of course this doesn't make too much sense as almost all Hello World examples but you'll see soon how to get further in just a fiew steps.

## the model of a component

```js
    component: {
        component: DOMElm,
        element: DOMElm,
        model: Array [{
            cr-id
            elements
            events
            index
            parentNode
            views
            [childNodes]
        }, ...], root{childNodes: Array},
        name: String,
        templates: Object
    }
```

### the methods of a component (modules)

In our previous example we created a module stored in ```helloWorld```. This module has a lot of methods you can use:

 - getElementById
 - getElementsByProperty
 - appendChild
 - prependChild
 - insertBefore
 - insertAfter
 - replaceChild
 - removeChild
 - sortChildren
 - reinforceProperty
 - addProperty
 - getProperty
 - getCleanModel
 - destroy
 - uncloak
 - reset
 - render

To learn what they do please refer to VOM.js and its API documentation. Every method that changes the model in VOM will automatically be reflected/rendered.

The last three methods ```uncloak, reset, render``` are Circular and Schnautzer related.

Quick example with previous demo:

```js
helloWorld.replaceChild({name: 'FooBar'}, helloWorld.model[0]);
```

VOM is actually build to easily handle nested model types, so models with children, just like in the DOM tree. So, if you would say:

```js
var model = {
    name: 'FooBar',
    childNodes: [{
        name: 'foo'
    }, {
        name: 'bar'
    }]
}
var helloWorld = new Circular().component('hello-world', {
    model: model,
    mountSelector: 'span'
});
```

...the outcome would be:

```HTML
<div cr-component="hello-world" cr-container>
    <span>
        FooBar
        <span>foo</span>
        <span>bar</span>
    </span>
</div>
```

You probably see where this is going. It is therefore quite easy to render a tree. As soon as you replace a child with ```replaceChild()``` it's children get updated / re-rendered automatically.

## more methods... to be continued

Circular.destroy
Circular.model
Circular.template

Circular.subscribe
Circular.publish
Circular.unsubscribe

Circular.addRoute
Circular.removedRoute
Circular.toggleRoute

Circular.loadResource
Circular.insertResources
Circular.insertComponent

Circular.Toolbox
	closest
	$
	$$
	addClass
	removeClass
	toggleClass
	hasClass
	addEvents
	removeEvents
	addEvent
	removeEvent
	storageHelper
	lazy
	itemsSorter
	normalizePath
	ajax
	errorHandler
	Promise

	requireResources
	captureResources

Schnauzer
	render
	parse
	registerHelper
	unregisterHelper
	registerPartial
	unregisterPartial
	setTags
