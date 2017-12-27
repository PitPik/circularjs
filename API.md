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
    
    beforeInit: function(component),
    onInit: function(component),

    template: Object SchnauzerTemplate || String 'name'
    helpers: Object {String 'name': function()}

    preRecursionCallback: function()
    enrichModelCallback: function()
})
```


```component()``` initializes a named component and renders it right away according to its model if you're using a template. Setting up a component assumes to have a HTML-tag set in the document that has an argument ```cr-componen=""``` with the value of the component's name (names are like IDs, so last of same name would overwrite privous one or actually reinitialize). Inside the component you can use Schnauzer.js templates (works almost as Handlebars) to render the model. Therefore you need to define cr-container to let ```component()``` know where to render the items into and a script tag with the attribute ```cr-template-for``` with the name of the component. 

### parameters for ```components```

```Circular.component()``` returns the component object that will be described further down in "the model of a component".

#### model: Array of Objects
The model that reflects the view. Needs to be an Array (look at it as the children of a DOM body)

#### extraModel: Object {} || Array [],
This is used to get some more data to the model for rendering inside templates without polluting the model itself. Those datas are available in any branch of the model, no matter how deep it is (as if it was present with evey child).

#### listeners: Array [String 'modelItem', '*', ...],
Defines the properties of the model items to listen to changes. If they get set, the callback function defined in ```subscribe``` gets called.

#### subscribe: function(property, item, value, oldValue, type)
The callback function being called when properties of the model change defined in ```listeners```. The function takes parameters such as:

 - ```property``` that is a String with the name of the property that changed (but also ```appendChild``` etc.)
 - ```item```, the model item being affected
 - ```value``` the new value being set to the model item's property
 - ```oldValue```, the previous value
 - ```type```, ???

#### eventListeners: Object {String 'name': function(e, element, item), ...},
The callback functions for the event listeners defined with ```cr-event``` in the template inside the component.
The function takes parameters such as:

 - ```e``` the actual DOM event
 - ```element``` the DOM element being defined as component item if event listener is set on the cr-component element, other than that the element where the event listenere was defined.
 - ```item```, the model item being affected.

#### componentElement: Object DOMElement,
If you choose not to have a element defined with ```cr-component="myName"``` you have to let circularJS know what DOM Element should be the component by defining it here.

#### componentWrapper: Object DOMElement,
Is the container or context where to look for the component with the given name. In case there are more components with the same name but the "wrapper" is known, this can help to pick the correct component.

#### mountSelector: String selector,
If you're building a nested construct like a link tree then you need to let the rendereing engine know where to render the children of the just rendered item. This points to the container element of the child.

#### beforeInit: function(component),
A callback function being called right before the component is initialized. The model can still be manipulated and the event listeners and the templates are are not installed at this moment. ```component``` is the object that is also returned by ```component()``` itself.

#### onInit: function(component),
A callback function being called right after the component is initialized.

#### template: Object SchnauzerTemplate || String 'name'
You can add template definitions to your components for 'manual' use inside your callback functions.

#### helpers: Object {String 'name': function()}
Definition of helpers for Schnauzer template engine (inside component only). Can also be defined when instantiating CircularJS for global usage.

#### preRecursionCallback: function()
A callback function being called while processing the new model right before a recursive call to the item's children.

#### enrichModelCallback: function()
A callback function being called while processing the new model right before the properties get processed (as listeners).


## Let's look at a simple "Hello world!" example:

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

So, here we have set up a ```<div cr-component="hello-world" cr-container>``` with the declaration of its name and a hint that it is also the container for the rendering done with ```cr-container```.
The template is defined inside the script tag (there are other ways to do that) where ```cr-template-for="hello-world``` explains where the template belongs to. Note that templates require one root element. This is due to performance reasons.
Inside the template you see just regular Handlebars like syntax.
The outcome will be as expected:

```HTML
<div cr-component="hello-world" cr-container>
    <span>Hello World!</span>
</div>
```

Templates can be defined anywhere in the document but also being imported from the server or defined inline with or without pre-compilation. (TODO: explain external, named, ...)

Of course this doesn't make too much sense as almost all Hello World examples but you'll see soon how to get further in just a fiew steps.

## the model of a component

```js
component: {
    container: DOMElm, // if container is different from cr-component
    element: DOMElm, // element defining component (cr-component)
    model: Array [{
        someCustomProperty: (...), ... // setter/getter if defined in listeners
        cr-id: String
        elements: Object {
            container: DOMElement, // defined by cr-container where elements get rendered
            element: DOMElement // component item
        },
        events: Object { // event based data per item (for internal usage)
            click: Object {
                cbName: [DOMElement]
            }, ...
        },
        index: Int // like the index of DOMElements
        parentNode: Object {childNodes: []}
        views: Object { // elements cache defined by cr-view="nameOfView"
            nameOfView: DOMElement, ...
        },
        [childNodes Array []]
    }, ...], root{childNodes: Array},
    name: String, // name of the component
    templates: Object // Schnauzer templates if define by cr-template="templateName"
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

To learn what they do please refer to VOM.js and its API documentation.
Every method that changes the model in VOM will automatically be reflected/rendered.

The last three methods ```uncloak, reset``` are Circular related:

#### uncloak(item)
Pass the model item to the function and it will remove the attribute ```cr-cloak``` and the className ```cr-cloak``` from the item's ```element```.

#### reset(model)
Does practically the same as calling ```component('myName', {model: model})``` on an existing component. It empties the view and re-renders it according to the new model.


### Quick example with previous demo:

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
	toggleClasses
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
