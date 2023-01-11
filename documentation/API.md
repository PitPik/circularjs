# CircularJS API

For a start, a **typical setup** of a **component** (similar to Angular).

```javascript
require(['circular'], ({ Component }) =>

Component({
  selector: 'my-app',
  template: '{{text}}',
  // initialize: true, // only for main app
},
class MyApp {
  constructor() {
    text = 'Hello world';
  }
}));
```

To start an app **automatically** place `<my-app></my-app>` in your `index.html` file and set the option `initialize: true`. All other components **don't need this option** and can be initialized by just **placing the HTML tag** like `<my-component></my-component>` inside this/other template/s.

`template` and `styles` can also be imported via **`AMD`**, just like any resource/dependency needed for the component like other components, services, helpers, partials, etc.:

```javascript
require(['circular', '!my-app.html', '!my-app.css'], ({ Component }, template, styles) => {
  // ...
});
```

The rest of the app is then defined inside the `class` definition. The example above would already run (when `initialize: true` is set) and render "Hello world" on the page.

## Table of contents (whole documentation)

- [CircularJS static methods](#circular-static-methods)
- [Schnauzer (Handlebars templating)](SCHNAUZER.md)
- [The view model (VArray)](VARRAY.md)
- [CircularJS instance methods](CIRCULAR.md)
- [Toolbox (ajax, Promise, etc.)](TOOLBOX.md)
- [AMD Asyncronous Module Loader](AMD.md)

## Circular static methods

**Table of contents (within this page)**

- [Circular.Component](#circularcomponent)
- [Circular attributes](#circular-attributes)
- [Live-cycle methods](#methods-inside-components)
- [Circular attributes](#the-six-circular-attributes)
- [Circular.Module](#circularmodule)
- [Circular.Plugin](#circularplugin)
- [Circular.Service](#circularservice)
- [Circular.Toolbox](#circulartoolbox)
- [Circular.CreateInstance](#circularcreateinstance)

### Circular.Component

The options of the *"decorator"* like `Component()` can have the following properties:

```javascript
Component({
  selector: string; // selector of the component,
  template?: string; // the template of the component. Optional for components that just delegate.
  styles?: string[]; // the styles of the component
  subscribe$?: { [key: string]: string[] }; // definition of the data-change listeners of the view model
  initialize?: boolean; // automatically initializes the component as a singleton.
  context?: HTMLElement; // a context helping to find the auto-initialized component.
  helpers?: { [name: string]: Schnauzer.helper }; // see Schnauzer
  partials?: { [name: string]: Schnauzer.partial }; // see Schnauzer
  attributes?: { [name: string]: Function }; // see Schnauzer
  extra?: { [key: string]: any }; // some extra data to feed the template
  circular?: Circular; // a custom 'new Circular()' instance being used for this component
} ,...
```

#### selector

This string defines the HTML selector of the component so you can use it anywhere like `<some-component></some-component>`. Once imported via **`AMD`**, this component can be used by just placeing this HTML tag anywhere inside a template (unless used with attribute `cr-lazy`, so it doesn't even have to be imported yet).

#### template

This string defines the HTML template used with Handlebars being rendered within the component. It can be defined in the component or imported via **`AMD`**.
When calling a component you can also have HTML inside which then can be used via the automatically created partial `{{>@content}}` to either have one part of the template dynamic or to replace it all. From the example above:

```js
Component({
  selector: 'my-app',
  template: '{{>@content}}. How is it going?',
},
class MyApp {
  constructor() {
    text = 'world';
  }
}));
```

and the component usage:

```HTML
<my-app>
  Hello {{text}}
</my-app>
```

would render "Hello world. How is it going?" on your page.

#### styles

This array holds a bunch of strings that define some CSS. It's an array so you can concatinate string for better formatting or just add some general imported styles to it. You don't get the convenience like in Angular where all styles only work on that specific component but you can always use like in SASS the selector-wrapper named after your component: `my-app { ... }`

#### subscribe$

This object defines listeners to the view model(s) of the component. It can look like this:

```js
subscribe$: {
  this: ['foo'],
  'tree:children': [],
}
```

**the class subscriber, `this`**

This means we probably have a variable `this.foo` defined in our component and at any time this variable would change, we can react in the subscriber `this$()` defined in the component on that change:

```js
this$(property, item, value, oldValue) {
  // ...
}
```

The arguments of this callback are

- `property`, a string defining the "key" of the property being changed, here `foo`
- `item`, the Object itself, so in this case `this` or better, the `MyApp` instance.
- `value`, obviously the new value being assigned
- `oldValue`, the value it had before the change

If returning `false` inside this callback would set the value back to the old value without calling this callback again though, acting like a rejection of the new value.

**the array subscribers, here `tree`**

The subscriber `'tree:children': []` is a bit more complex. First, you can also have a subscriber callback `tree$()` like just described before and react on changes there. The reason of the fact that the array there is empty sits in the template.

For further explanation let's asume the component has a view model like such:

```js
this tree = [{
  title: '1st item'
}, {
  title: '2nd item',
  children: [{
    title: 'child of 2nd item',
  }]
}];
```

**Schnauzer** templates can have "dynamic" variables like `{{%title}}`. The `%` makes this variable dynamic and therefore **observable**. The fact that it's defined as such in the template makes the definition inside the array of `'tree:children': []` obsolete. If there are variables within the model that the template doesn't use and you still want to listen to changes, you can still define it in that configuratin: `'tree:children': ['title']`

The `:children` part defines the name of the children (or the branches of the tree) being used in this model. In the template you would represent this with a block like:

```HTML
...
{{#each %chilren}} ... {{/each}} <!-- inside recursive template -->
...
```

This makes your **children dynamic** and **mutable** with all the mutation functions an Array offers (including some extra methods explained later on or in the section `VArray` in this documentation). For arrays an their manipulations, the changes are not represented in `tree$()` but in `tree$Move()`.

Any other Object can also be subscribed to like `myObject: ['foo', 'bar']` and listened to in `myObject$(property, item, value, oldValue) {}`. All those subscriptions are **canceled automatically** when a component gets **destroyed**.

#### initialize

This is simply a boolean that triggers the component to initialize itself without being introduced in a template. Ususally it's the starting point of your app. The component will end up as a singleton and not being re-usable anymore.

#### context

Is a helper (HTMLElement) to the `initialize` option. It can help finding the `<my-app></my-app>` tag. See it as giving a context to jQuery's `$()`. So CircularJS looks inside the context for the app HTML tag. Probably never used but there for special occations...

#### helpers

See `Schnauzer` about helpers. When adding helpers to the component they will be available inside the template.

Helpers can be used for any reason. Thinking of Angular they can replace pipes like `date`, `format` etc. but they could also help setting up `picture` for hi-res `<img src="">` tags or help setting up `Router` links in case you don't want to use `hashes` in your routing. In the future I will come up with a useful set of helper that will take care of all those neeeds (stay tuned).

#### partials

See `Schnauzer` about partials. When adding partials to the component they will be available inside the template.

Also see `{{>@content}}` described above. It is a special partial that will be installed automatically when there is content within the component HTML tags.

#### attributes

See `Schnauzer` about attributes. When adding attribute functions to the component they will be available inside the template. **CircularJS** alredy offers a wide set of attribute functions (described in `Schnauzer`).

#### extra

This is some extra data for `Schnauzer` templates. Let's say you have a deep tree and the links inside the branches always start with the same string, you can add this data to `extra` and it can then always been found within the template, no matter how deep you're inside the tree model:

```js
extra: { linkRoot: 'https://my-domain.com/my-app-service/' }
```

and the template:

```HTML
...
<ul>
  <li>
    {{%title}}
    <a href="{{linkRoot}}my-special-link.html">{{%link}}</a>
  </li>
  ...
```

Will end up as `<a href="https://my-domain.com/my-app-service/my-special-link.html>`

#### circular

This option takes an instance of circular in case you need some special setup for your component. This is a bit experimental and probably never used. But, maybe just good to know that this option does exist...


### The six Circular attributes


#### `cr-event`

This is the proper way to install event listeners to HTMLElements via **Schnauzer** templates.

```Handlebars
<div cr-event="click; mousedown: doSomething; dblclick?: dblclick; input!: input">...</div>
```

This example shows 4 different ways of setting event listeners:

`click` will listen to a click event and also expects a `click()` method in your component.

`mousedown` listens to mousedown and calls `doSomething()`

`dblclick?` listens to dblclick and calls `dblclick()` although it is used in combination with event delegation.

`input!` listens to input events and calls `input()` although the listener gets install with capture `false`.

##### How event listeners work in detail

Every `cr-event` value expects a method in the component, otherwise it will just silently fail.

```js
clickHandler(e, elm, item, model, ...) {
  // do your magic here...
}
```

`e` is the Event model.

`elm` represents the HTMLElement registered in the `VArray` view model, so in loops like lists or trees, every closest loop item or if not, then the component's `this`.

`item` is the model part that represents the rendered item and

`model` is the Array or better `VArray` where `item` comes from.

Using `e.stopPropagation()` or just returning `false` does the same.

> When dealing with lists, tables or trees you can install the event listener with a `?` on its root element so you can realise event-delegation. This speeds up rendering of big ammounts of items as they don't need to register to the event-controller one by one.

#### `cr-lazy`

In case you want to make components load lazy because you include them in an `{{else}}` part of the template and don't usually expect them to show up or you use `circular.createComponent()` and also not want to load it by default, you can add this attribute to the component and make it load later. This way you **don't need to** import it inside `define()` or `require()`. The value of the attribute can help to find the resource if the `selector` doesn't match the resource name. Instead of adding an attribute value you can also introduce a property in the **amd configuration** to find the resource.

#### `cr-view`

This is kind of a left over from a previous version of **CircularJS**. You can add this attribute to any HTMLElement and then find it in your component using `circular.getView(value, element)`. You culd probably do the same using `Toolbox.$(selector)` but after findin the element with `getView()`, the attribute will be removed (if not in debug mode).

#### `cr-input`

This attribute can transport variables from the parent to the child for direct communication.

```Handlebars
<div cr-input="foo; bar=foo; fooBar='some text'">
```

See more details [in the above description](#constructorelement-input-circular).

#### `cr-scroll`

When having an `{{#if %foo}}<div> ... </div>{{else}}...{{/if}}` situation in your template and there is a HTMLElement container inside that `<div>`, or the `<div>` itself, that shows a scroll bar then you will usually loose the scroll position when coming back from the `{{else}}` part. To prevent this, you can mark the Element with a `cr-scroll` attribute and it will automatically restore the scroll positions of all containers inside the `{{#if %foo}}` block that contain that attribute. The same is valid for using `circular.hideComponent()` after restoring the component.

#### `cr-cloak`

This does actually nothing to the component. This attribute just disapears after the component is rendered and attached to the DOM. This can be used to have a class `[cr-cloak] { display: none }` in your CSS if you wish.


### Methods inside components

A component has some pre-defined methods, some depending on the used view-models, some just always available.


#### Livecycle methods


##### `constructor(element, input, circular)`

The constructor will always provide the following arguments:

- `element` the HTMLElement of the component
- `input` a function that will import variables from the parent
- `circular` an instance of circulaJS used for this component

To explain `input(this)` a bit better: Every component can import variables from its parent for communication between parent and child.

```HTML
<my-component cr-input="foo; cBar=bar; fBar='some text'"></my-component>
```

To import those variables you need to first define those varibles in the child component and then call `input(this)`.

```js
constructor(element, input, circular) {
  foo = [];
  cBar = {};
  fBar = '';
  input(this);

  moreVars = '';
}
```

If the variables on the parent are dynamic defined in `subscribe$()` option and change, the changes will be transferred to the child and can also be subscribed to. If you know Angular then think of the `@Input` decorator but not used for each variable but for all before `input(this)`.

To communicate from the child to the parent you can use `circular.triggerEvent()` and install an event listener on the parent. This will be explaind in the **Circular instance methods** section of this documentation.

##### `onInit(element, circular)`

This method gets called as soon as the component is initialized and rendered on the page. The `element` is like in `constructor(element, input, circular)` the HTMLElement of the component and `circular` also an instance of CircularJS used for this component.

##### `onLoad(element, circular)`

This method is the same as `onInit(element, circular)` with the only difference that it can be called more than once.

The CircularJS method `hideComponent()` can take components out of the DOM tree and later on recover or put it back to where it was. When this happens, `onLoad(element, circular)` gets called again.

##### `onChildInit(element, instance, name)`

This method gets called when a new child element within the component gets initialized.

- `element: HTMLElement` the childs' DOM representation
- `instance: component` the instance of the childs' class
- `name: string` the selector of the child

##### `onBeforeChildInit(element)`

This method gets called when a new child element within the component is about to gete initialized.

- `element: HTMLElement` the childs' DOM representation

##### `onDestroy()`

Gets called when components gets destroyed.


#### View model mutation callbacks


##### `this$(property, item, value, oldValue)`

This method only gets "installed" on your instance of the class automatically when you define subscribers with the component option `subscribe$: { this: [] }`. The functionality is descibed [above in the section subscribe$](#subscribe)

##### `myModel$(property, item, value, oldValue)`

This method only gets "installed" on your instance of the class automatically when you define subscribers with the component option `subscribe$: { myModel: [] }`. The functionality is descibed [above in the section subscribe$](#subscribe)

##### `myModel$Move(action, key, item, model, previousModel)`

This method only gets "installed" on your instance of the class automatically when you define subscribers with the component option `subscribe$: { myModel: [] }`.
It gets called when there is a VArray mutation for adding, removing, moving, sorting, ... executed and therefore the view updated (how this can be done will be explaind in the [view model (VArray) part of the documentation](VARRAY.md)).

**the arguments**

- `action: string` possible values: `add`, `move`, `remove` and `sort`.
- `key: string` the name or index of the processed item.
- `item: any` the view model item that was processed.
- `model: Varray` the parent of the view model item that was processed.
- `previousModel: Varray` the parent of the view model item that was processed in case it was moved.


##### `myModel$PR(item, parent, root)`

This method only gets "installed" on your instance of the class automatically when you define subscribers with the component option `subscribe$: { myModel: [] }`.
This method gets called right before it transforms into a `VArray` view model, gets iterated over the children and before the subscribers get set up. So, the last point where properties can be added to that model before it gets "locked" as being a view model.

**the arguments**

- `item: any` an item within the `VArray` view model
- `parent: VArray` the holder of the `item` (Array)
- `root: VArray` the root the view model. If thinking of a more dimentional Array with child nodes like in a table or a tree, this would be the initial Array.


### Circular.Module

This is not clear yet what it should be (in the future...).

It currently acts like a `Component({ initialize: true })` but it could change in the future for something more useful.

### Circular.Plugin

Not yet implemented

### Circular.Service

Not yet implemented.

### Circular.Toolbox

This is a reference to Toolbox so you might not have to import it but use it from the instance if CircularJS.

### Circular.CreateInstance

CircularJS initializes automatically with the first incoming component. It uses all the default options though. If you want to set debugger on or change any of the default options then call this function before importing any of the components.

```js
Circular.CreateInstance(name, options, componentName);
```

where `name` would be the name of the instance (just for debugging), `options` are the options you want to be active in all components and `componentName` would be the first component that gets loaded (for convenience, so you don't have to call it yourself).

`componentName` is optional though.

#### The options

```js
{
  hash: '#', // hash symbol for routing
  partials: {}, // Schnauzer partials. key is name of partial;
  helpers: {}, // Schnauzer helpers. key is name of helper;
  attributes: {}, // Schnauzer attributes. key is name of attribute being supported;
  debug: 0, // 0 -> off; 1 - 3 levels of feedback
}
```

The `debug` options not only defines the level of feedabck you get in the console but also leaves the `cr-xyz` attributes (like `cr-event` etc.) on all HTML Elements and all the `cr-id` that are visible on all view elements to be able to compare to the view model.
