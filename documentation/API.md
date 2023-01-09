# CircularJS API

> This documentation is not complete yet, although on the way...

For a start, a **typical setup** of a **component** (similar to Angular).

```javascript
require(['circular'], ({ Module }) =>

Component({
  selector: 'my-app',
  template: '{{text}}',
  initialize: true, // only for main app
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

## Table of content

- [CircularJS static methods](#circular-static-methods)
- [Live-cycle methods](#methods-inside-components)
- [Schnauzer (Handlebars templating)](SCHNAUZER.md)
- [The view model (VArray)](VARRAY.md)
- [CircularJS instance methods](CIRCULAR.md)
- [Toolbox (ajax, Promise, etc.)](TOOLBOX.md)
- [AMD Asyncronous Module Loader](AMD.md)

## Circular static methods

### Circular.Component

The *"decorator"* options of `Component()` can have the following properties:

```javascript
Component({
  selector: string; // selector of the component,
  template: string; // the template of the component
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

This string defines the HTML selector of the component so you can use it anywhere like `<some-component></some-component>`. Once imported via **`AMD`**, this component can be used by just placeing this HTML tag anywhere inside a template.

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

### Methods inside components

A component has some pre-defined methods, some depending on the used view-models, some just always available.


#### Livecycle methods


##### constructor(element, input, circular)

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

##### onInit(element, circular)

This method gets called as soon as the component is initialized and rendered on the page. The `element` is like in `constructor(element, input, circular)` the HTMLElement of the component and `circular` also an instance of CircularJS used for this component.

##### onLoad(element, circular)

This method is the same as `onInit(element, circular)` with the only difference that it 

##### onDestroy()


#### View model mutation callbacks


##### this$(property, item, value, oldValue)

##### myModel$(property, item, value, oldValue)

##### myModel$Move(action, key, item, model, previousModel)

##### myModel$PR(item, parent, root)
