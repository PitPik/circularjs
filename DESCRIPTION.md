With **circularJS** you basically develop **components**, **modules** and **services**.
A **component** controls a patch of screen called a view, also used for **state management**, where as **modules** are a compositions of several components in a widget like HTML document that can be rendered inside an existing app or even component.

### component

```component()``` takes a part of the DOM (defined by ```cr-component="component-name"``` or by passing the DOM-Element to ```element```) and converts it to a view manageable component.

To manage/render repetitive parts of this component you have to define a template with ```<script type="text/template" cr-template-for"component-name">``` or passing a processed template to ```template```where you write Schnauzer templates and a container with ```cr-container``` where the template gets rendered.

The ```model``` (an Array) defines then how those parts get (re-)rendered and the Schnauzer template picks up the model components by its place-holders. ```extraModel``` is meant for Schnauzer to have an alternative lookup-model for rendering so you don't have to polute the main model with extra information.

If you have a nested model with ```children```, those parts then get rendered inside the container defined by ```mountSelector``` where you pass the selector of the container defined in the template.

```cr-view="view-name"``` and ```cr-event="click: clickHandler"``` attributes in the template are used to store DOM-element references in the resulting model and to reference to automatically installed event listeners that then can then be defined and used with the definition in ```eventListeners : { clickHandler: (e, element, item) => {} }``` where ```item``` is the model item (this = instance).

```js
Circular.component(name: 'String', parameters: Object {
    model: Array [],
    extraModel: Object {} || Array [Object {}, ...],
    subscribe: function(property, item, value, oldValue, type),
    listeners: Array [String 'modelItem', '*', ...],
    eventListeners: Object {String 'name': function(), ...},
    element: Object DOMElement,
    wrapper: Object DOMElement,
    mountSelector: Object DOMElement,

    onBeforeInit: function(component),
    onInit: function(component),

    template: Object SchnauzerTemplate || String 'name'
    helpers: Object {String 'name': function()}

    preRecursionCallback: function()
    enrichModelCallback: function()
})
```

It returns an instance of the new component and holds a rich model and a lot of methods to rearrange the model just like you would manage a DOM tree.

Every change to the model triggers a callback that is defined in ```subscribe: function(property, item, value, oldValue, type)``` where ```property``` is the name of the property being manipulated in case a listener is defined with ```listeners```, ```item```is the model item, ```value``` is the new value, ```oldValue``` the previous value before the manipulation, ```sibling``` is an Element reference in case of the methods ```appendChild```... are used.


### module

Circular apps are modular. Every module can be developed standalone taking care of its own dependencies and components and therefore being independent from other modules.

You basically set up a HTML page preferable with all the `<link>` and `<script>` tags/resources defined and use components to build the desired functionality. If you need resources for development only (mocks, css, etc.) you just need to add "cr-dev" to the resource and it will be ignored when being injected.

This page with all its dependencies/resources/templates can then be injected into the main app by calling ```renderModule()```. This method returns a ```Promise()``` that returns the main dependency that was defined in ```renderModule()``` that can be fetched data, a class, a function or anything else you need it to be to start it up. There are actually more methods to inject modules (```insertModule```, ```insertResources``` or ```loadResource```), but this one is the most convenient way.

This is probably one of the most powerful methods in circularJS.
This method loads an HTML page, processes its dependencies like scripts, style-links and styles, puts them into the current page and then appends the body's or the defined container's (```cr-dev="container"```) children to the mai-document's container defined by ```renderModule({container: ...})```.
It uses ```Circular.loadResource()```, ```Circular.insertResources()``` and ```Circular.insertComponent()``` to achieve that.
This way you can develop widget like modules and easily append it to the main app.

Another powerful feature is that you can start downloading data and pass its promise before you actually download and render the view, so downloading data and rendering can be done at the same time and therefore dramatically speeds up rendering.

```
renderModule({
    data: Data getting sent to the required module (aside with path)
    name:
    previousName:
    path: String: path to the modules's HTML file
    container:
    require: String:  module name
    init: Boolean: auto-start required module (also if undefined)
})
```









