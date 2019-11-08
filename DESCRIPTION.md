With **circularJS** you basically develop **components**, **modules** and **services**. **Plugins** (also known as Directives) can enhance a Component or a Module.
A **component** or **Module** controls a patch of screen called a view, also used for **state management**, where as **Plugins** are enhancing a host. **Modules** are mostly also a starting point for a partial app. They can initialise themselfs, whereas **Components** need to be triggered by the view engine or manually.

### Component

With ```Component(options, Klass)``` you create a blue-print of a component that then can be injected into the DOM by providing a HTMLElement with the same name as thhe selector of the Component. Initialising this component converts That HTMLElement into a view manageable component.

The template in the Component defines the view, whereas **cr-for** attributes can render very complex view-parts like **lists**, **trees** and **table structures** that can easily be controlled within the Component itself.

It depends on the structure of the model how you can render those structures.

If you have a nested model with ```children: []```, those parts then get rendered inside the container defined by a ```cr-mount``` attribute which would render a **tree** structure.
You would use a ```cr-child``` attribute to define a **table structure** to berendered.
A simple **list** structure doesn't need any special attribute.

```cr-view="view-name"``` and ```cr-event="click: clickHandler"``` attributes in the template are used to store DOM-element references in the resulting model and to reference to event listeners in your class like: ``clickHandler: (e, element, item) => {}``` where ```item``` is the model item and ```element``` is the element the eventlistener was attached to.

```js
Component({
    selector: 'my-component',
    template: '<div>My Component works!</div>'
    styles: '',
    subscribe$: { this: ['*'] },
    helpers: { someTemplateHelper: function() {} },
}, class MyComponent {
    myLocalVariable: 'Hello';

    constructor() {}
    this$() {}
    onInit() {}
    onDestroy() {}
})
```

Every change to the ```myLocalVariable``` would in this case triggers the callback ```this$() {}``` where ```property``` is the name of the property being manipulated, ```item```is the model item (in this case ```this.myLocalVariable```), ```value``` is the new value, ```oldValue``` the previous value before the manipulation.
Models with more complex structure such as for tables and trees would return the ```item``` and ```element``` of the inner part of the model.

### Module

Modules are internally just Components. They are created by using **Module()** instead of Component(). The only difference is that they know how to initialse themselfs. Therefore they are a good starting point for an app.

### Plugin

**Plugins** are just like **Components** but dont have their own host element and therefore no template defined. They can be used to enhance an existing **Component** or **Module** by adding event listeners and / or manipulating the inside DOM of its host.

### renderModule()

```renderModule()``` can help you dynamically (lazy-load) **Modules** but also **Components**. It takes some extra options that can help you influence the way of adding Components or Modules to your page.

```js
renderModule({
    selector: 'my-selector',
    container: HTMLElement,
    init: true, // only for Components
    data: {}, // only for Components
})
```
