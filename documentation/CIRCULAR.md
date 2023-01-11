# CircularJS instances

At the time when components are defined there is a common instance already available or you can create a custom instance yourself. The instance of circular will get presented to you in the `constructor()` of your component classes and in the `onInit()` and `onLoad()` methods of your component, but can also be imported via `circular`.

```JS
require(['circular'], ({ Component, circular }) => {});
```

The instance offers quite some usefull methods to manage your apps.

- [createComponent(selector, attrs, component, node)](#createcomponentselector-attrs-component-node) dynamically creat components on the fly
- [getChildComponents(inst)](#getchildcomponentsinst) returns all children currently rendered within the component
- [getParentComponent(inst)](#getparentcomponentinst) returns the parent of itself
- [hideComponent(elm)](#hidecomponentelm) removes the component from the DOM and returns a recover function
- [destroyComponent(elm, remove)](#destroycomponentelm-remove) removes a component

- [triggerEvent(type, data, params)](#triggereventtype-data-params) triggers custom events
- [installEvent(element, type, func, cap)](#installeventelement-type-func-cap) installs event listeners if needed
- [getView(value, element)](#getviewvalue-element) find Element with attribute `cr-view` (old implementation)
- [subscribe(inst, comp, attr, callback, trigger)](#subscribeinst-comp-attr-callback-trigger) PubSub subscriber
- [publish(inst, comp, attr, data)](#publishinst-comp-attr-data) PubSub publisher
- [unsubscribe(inst, comp, attr, callback)](#unsubscribeinst-comp-attr-callback) PubSub unsubscriber
- [addRoute(data, trigger, hash)](#addroutedata-trigger-hash) Adds a route to the component
- [removeRoute(data)](#removeroutedata) Removes a route from the component
- [toggleRoute(data, isOn)](#toggleroutedata-ison) toggles routes


### `createComponent(selector, attrs, component, node?)`

This method can create a component on the fly and appends it to your view. It is then treated as if it was part of your template. It creates a HTMLElement defined by `selector` and adds attributes to it defined by `attrs` (also good for the `cr-lazy` attribute in case your component hasn't already imported this component).

The argument `component` will always be `this` to define its parent and `node` is optional if the new created component should be appended at a different HTMLElement than the parent itself.


### `getChildComponents(inst)`

This method takes `this` as the only argument and return an Array filled with all found child components. The items of the array contain an Object with the following key/value pairs:

```js
{
  element: HTMLElement; // of child component
  instance: any; // the instance of the component
  name: string; // the selector of the component
}
```

### `getParentComponent(inst)`

Same as `getChildComponents(inst)` but the other way around, getting the parent component. The method returns just an Object, not an Array. The Oject looks just like the one desribed above in `getChildComponents(inst)`.

### `hideComponent(elm)`

This method takes the component defined by the argument `elm` (a HTMLElement) out of the DOM, but remembers where to put it back.

The method returns a `recover()` function that, when called (without arguments), puts the component back to where it was.

Additionally, it takes care of inner HTMLElements with the attribute `cr-scroll` that the scroll position will be recovered as well.

If the component has the methos `onLoad()` defined, it will also get triggered.

### `destroyComponent(elm, remove?)`

This detroys components defined by the argument `elm` as HTMLElements. Be carefull though with this method.

The argument `remove` is an optional boolean that determins weather the HTML of the component should also be removed from the DOM.

### `triggerEvent(type, data, params)`

This is almost like `dispatchEvent(new CustomEvent())` whereas the `type` as string defines the name of the event being triggered, `data` defines the `detail` being traferred by the event and `params` as either a HTMLElement or an object with params like the argument for `new CustomEvent()`. If `params` is a HTMLElement then it will check for the first available `VArray` registered HTMLElement and send this as target. If more `params` are needed, you can put the desired element as `element` inside the `params` object.

### `installEvent(element, type, func, cap)`

This is exactly like `element.addEventListener(type, func, cap)` but then with some convenience layers. It will set `cap` (meaning `useCapture`) to true in case the `type` is either `focus`, `blur`, `mouseenter`, `mouseleave` or `scroll` and it will return a function (no arguments required) to automatically un-install the event.

Most memory leaks happen when wrongly un-installing event listeners as the function `removeEvent` silently fails if you do something wrong. The returned function will take care that your installed event listener get removed correctly.

### `getView(value, element)`

This is kind of a left over from a previous version of **CircularJS**. You can add an attribute `cr-view` to any HTMLElement inside your component and then find it using `circular.getView(value, element)`. You culd probably do the same using `Toolbox.$(selector)` but after findin the element with `getView()`, the attribute will be removed (if not in debug mode).

`value` is a string defining the value of the `cr-view` attribute and `element` is the element of the component itself which you get from the `constructor`, `onInit` or `onLoad`.

### `subscribe(inst, comp, attr, callback, trigger)`

This is part of a `PubSub` implementation. This implementation has a convenient twist to it as it can catch the last message that has been sent before the subscriber was even installed. `trigger` is a boolen that determins if the subscriber should be triggered on previous messages being sent.

### `publish(inst, comp, attr, data)`

This is part of a `PubSub` implementation. It sends data across listeners set up with `subscribe()`.

### `unsubscribe(inst, comp, attr, callback)`

This is part of a `PubSub` implementation. It removes a subscription.

### `addRoute(data, trigger, hash)`

The router uses **CircularJS**s `PubSub` implementation so it can also pick up the last changes from the past, before the rout was ever set up. This functionality is enabled with the argument `trigger` as boolean.

The `data` is the opbject for all relevant settings for the rout like `path` and `callback`.

```js
{
  path: sting; // regex like, just like with standard routing path definition
  callback: (data: Array<path>{
    parameters: { [key: string]: string }
    queries: { [key: string]: string}
    path: string[]
  }) => {};
}
```

Example for `path`:

```js
path: '(/:appName)(/*)'
```

### `removeRoute(data)`

Removes a previously set route. `data` defines the data sent with `addRoute()`.

### `toggleRoute(data, isOn)`

Toggles a previously set route. `data` defines the data sent with `addRoute()`. `isOn` is a boolean defining if the router should be on or off.
