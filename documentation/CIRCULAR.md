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


### `createComponent(selector, attrs, component, node)`

### `getChildComponents(inst)`

### `getParentComponent(inst)`

### `hideComponent(elm)`

### `destroyComponent(elm, remove)`


### `triggerEvent(type, data, params)`

### `installEvent(element, type, func, cap)`

### `getView(value, element)`

### `subscribe(inst, comp, attr, callback, trigger)`

### `publish(inst, comp, attr, data)`

### `unsubscribe(inst, comp, attr, callback)`

### `addRoute(data, trigger, hash)`

### `removeRoute(data)`

### `toggleRoute(data, isOn)`
