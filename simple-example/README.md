# How to create a component

A component is a piece of HTML marked with an attribute ```cr-component="component-name"``` that can be initialized via a JS snipped like ```const myComponent = circular.component('component-name', {...});```, where the name, here 'component-name', has to match for circularJS to be able to find it in the DOM so it can initialize it.
The second argument of ```circular.component()``` is a configuration object for the component. The most important things that can be configured are:
 - model
 - listeners
 - subscribe
 - eventListeners
 There are more, but for this excursion this is all you need to know for now and will be explained after this block.

## A simple example

Let's look at a simple component, a UI that has a form with an input field that, if filled shows an 'empty' button that, when clicked, will empty the input field and therefore disappears again. So we're dealing with a state model and data binding. The input has an event listener 'oninput' and the button a 'click' listener which callback functions will manipulate our state-model's property 'hasInput':
```HTML
<form cr-component="test-component" cr-event="submit: preventDefault">
  <input cr-view="input" cr-event="input: onInput">
  <button cr-view="button" cr-event="click: doEmpty" style="display: none">empty</button>
</form>
```
and the code:
```javascript
require(['circular'], function(Circular){
  const circular = new Circular();

  circular.component('test-component', {
    model: [{ hasInput: false }],
    listeners: ['hasInput'],
    subscribe: (propName, item, value) => {
      item.views.button.style.display = value ? '' : 'none';
      if (!value) {
        item.views.input.value = '';
      }
    },
    eventListeners: {
      onInput: (e, elm, item) => item.hasInput = !!item.views.input.value,
      doEmpty: (e, elm, item) => item.hasInput = false,
      preventDefault: (e) => e.preventDefault(),
    }
  });
});
```

### So, what happens here and what do the 'options' do?

The ```model``` property holds the state-model of our UI. We need to know if the input holds some data, so we set 'hasInput' to 'true' or 'false' to make the button show or disappear. CLicking the button sets the property to 'false' and therefore lets the button disappear and also empties the input (described in the subscribe callback that updates the view).

The ```listeners``` property tells the component which state-model attribute-changes it should listen to, to trigger the ```subscribe``` callback. In our example we only have one, so, as soon as ```hasInput``` is changed, the ```subscribe``` callback is triggered (which manipulates the view).

The ```subscribe``` callback provides
  - ```propertyName```, the name of the property that has been changed, here 'hasInput',
  - ```item```, the item of the model array, here we only have one item in the model-array,
  - ```value```, the value that 'hasInput' currently carries (after the change),
  - ```oldValue```, the value that 'hasInput' carried before it was changed,
So, in this callback we show or hide button when the property 'hasInput' we're listening to is true or false.
We also empty the input field in case the value is empty.

The property 'hasInput' is set in the event listeners, defined in ```eventListeners```:
The markup has some attributes ```cr-event```. They define which event should trigger wich callback. Here we have 3: onInput, doEmpty and preventDefault. Only onInput and doEmpty change the 'hasInput' attribute of the state model.

After the component and therefore also the model is initialized, the cr-view and cr-event attributes get applied automatically to each item of the model array. This way, for every item (here we only have one) we have access to the cr-view elements from the markup, here ```item.views.input``` and ```item.views.button```.

We recommend that event listeners are only used to change the state model and the subscribe callback is used for DOM manipulation. This way you can create an isolated view controller and don't spread DOM manipulation all around the code.


## Refactor the example to be able to use templates and multiple items

The previous example described a static markup that needed to be controlled by a state model.
We can also render dynamic views that are dependent on the model we feed the component.
Let's look at a more complex example, that does the same as above but renders more input / buttons sets, just like in a dynamically rendered form.
```HTML
<form cr-component="test-component" cr-container onsubmit="event.preventDefault()">
  <label cr-template-for="test-component" style="display: block">
    <input cr-event="input: onInput" value="{{%value}}">
    <button cr-event="click: doEmpty" style="display: {{^%value}}none{{/%value}}">empty</button>
  </label>
</form>
```
and the modified script:
```javascript
require(['circular'], function(Circular){
  const circular = new Circular();

  circular.component('test-component', {
    model: [{ value: '' }, { value: '' }],
    listeners: ['value'],
    eventListeners: {
      onInput: (e, elm, item) => item.value = elm.value,
      doEmpty: (e, elm, item) => item.value = '',
    }
  });
});
```

First let's look at the changes in the markup:

```cr-container``` is added to tell circularJS that this element will be the container where all the rendered items will be appended to. The items will be defined by the template (```cr-template-for```):

```cr-template-for="test-component"``` is the attribute that tells circularJS that this element is the main template for this component. The value of this attribute needs to be the name of the component (as there might be more than one template per component, but about this later).

The ```cr-view``` atributes are taken away as they are not needed any more. You can also see that ```subscribe``` callback in the script doesn't exist any more as the markup can update its view itself automatically by using 'handlebars' syntax blocks within its template.

Changes in the script:

We added a second item to the model-array. This way the template ```cr-template-for="test-component"``` gets rendered twice. The event listeners now change only the 'value' property of it's model-item representation. But how does the view then get updated?

The template uses 'handlebars' like markup to render the markup on initialisation. By using a '%' in front of the variables we use in the handlebars blocks, we can make them dynamic even after the first rendering.
So, if a variable we defined in the ```model``` and made dynamic with ```listeners``` gets changed, the handlebars block part of the markup will update itself according to the state of the variable being used.
In the button this means that if the 'value' in the item model is empty, we render nothing, otherwise we render 'none'. This results in ```style="display: none"```. ```{{^%value}}none{{/%value}``` is equivilant to ```{{#if %value}}{{else}}none{{/if}}``` or ```{{#unless %value}}none{{/unless}}```.

The input listens to the keyboard input, to the onInput event, but also to the state of it's model and therefore sets itself to the correct state.

### Differences between rendering strategies

By using this way of rendering, cr-event and cr-view doesn't work outside its template any more. You might have recognised that ```cr-event="submit: preventDefault"``` was taken away from the ```<form>``` and replaced by ```onsubmit="event.preventDefault()"```; This dilemma could be solved by using ```e.preventDefault()``` inside the event callback of the button ```doEmpty```.
Another solution would be to wrap the component by another component that uses the previous rendering strategy.


## A more Angular like approach

Here is a reusable approach using Klasses that likes a bit more like the Angular way.

```HTML
<form test-component></form>
<form test-component></form>
```
and the script
```javascript
define('test-component', ['circular'], Circular => {
  return class TestComponent {
    constructor(element, model, circular) {
      this.component = (circular || new Circular()).component({
        model: model || [{ value: '' }, { value: '' }],
        element: element,
        listeners: ['value'],
        template: `<label style="display: block">
            <input cr-event="input: onInput" value="{{%value}}">
            <button cr-event="click: doEmpty" style="display: {{^%value}}none{{/%value}}">empty</button>
          </label>`,
        eventListeners: {
          onInput: (e, elm, item) => item.value = elm.value,
          doEmpty: (e, elm, item) => {
            item.value = '';
            e.preventDefault();
          }
        }
      });
    }

    static $$(selector, context, model, circular) {
      Circular.Toolbox.$$(selector, context).forEach(elm => new this(elm, model, circular));
    }
  }
});

require(['test-component'], TestComponent => {
  TestComponent.$$('[test-component]');
});
```

The main differences besides using Klasses is the usage of the element itself in place of the selector. So the first parameter passed to ```circular.component``` is skipped and herefore the ```element``` property is used in the configuration.
The template is taken out of the markup and placed into the configuration.

For the rest, it is quite the same as was before.

## Refactoring (even more) of template

If you look at the index.html you'll recognise even more changes. The style in the button is removed and replaced by an ```if``` to render the whole button (like Angular's \*ngIf). The ```<input>``` has an extra class attribute where the class name gets changed according to the ```value```'s state. This demonstrates Amgular's \*ngClass although this approach can be used for all attributes. The attributes ```disabled```, ```checked```, ```autocomplete```, ```contenteditable```, ```readonly```, and ```selected``` have a special behaviour: You can pass ```true```, ```false``` or an empty string to enable / remove the attribute).


## Comparing CircularJS to Angular with this example

Other than in Angular, CircularJS doesn't use decorators, magic functions, strings etc. or classes to create a component. CircularJS is based on vanilla JS and is therefore easier to understand / use as we don't need to know that many architectural design patterns to keep a view in sync with a state model, and that's all we actually need to achieve. CircularJS tries to keep things simple without compromises to the power of a decent MV* framework.

You might have recognized some similarities to Angular though:
The 'handlebars' syntax (it's here called 'schnauzer') is similar to the templating syntax from Angular although it doesn't include scripts. Therefore CircularJS doesn't need to 'eval' code, it just refers to real JS code instead (see event handles).
If there is more code needed for the templates you can use helpers, just like with handlebars helpers, a technique that might be known by a lot of developers already.

Some built in 'directives' like [ngFor], [ngIf], [ngClass], (click) etc. are covered in our example as well.
[ngIf], [ngClass] are covered by the handlebars templating language as you can see in the second example, [ngFor] is covered by ```cr-container``` and the event listeners like (click) etc. are covered by ```cr-event```.

Other than with Angular, CircularJS listens directly to its model changes and serves its subscribers. AngularJS has the 'digest' mechanism and Angular uses model ChangeDetectionStrategies, meaning that it crawls through the whole tree of components to check for changes of the model to determine if there has a view update to happen. This often causes a very aggressive re-rendering or re-checking of changes as a change of a property in a component could change some views way down the tree that has to be checked over and over again... Asynchronous actions are the problem that AngularJS and Angular have to tackle, whereas CircularJS doesn't have to deal with this problem as changes in the model are always resolved synchronously, no matter if they are triggered asynchronously or not. There is always a 1-to-1 relation between the model and the view, a connection that the programmer determines by its implementation and can therefore rely on.
CircularJS has direct subscribers to direct model changes. It might sometimes be more effort to subscribe to model changes manually but, most of the times you don't even need this as it's done for you, and second of all, this direct request / serve technique is way more performant and easier to understand why what is happening where. Less 'magic' keeps your mind clear and causes less surprises that are hard to debug.

