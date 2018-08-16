# MVC-Todo app complying to the TodoMVC specs on http://todomvc.com/

## How it works (in the scope of newcommers to CircularJS)

CircularJS works a bit like AngularJS and a bit like EmberJS. There are attributes in the HTML like ```cr-component``` that remind of ```ng-directive``` you would find in AngularJS but there are also HandlebarsJS like template parts that you also can find in Ember apps.

### The template

CircularJS mainly works with ```cr-...``` attributes to make references to the DOM tree elements. There are the follwing used in the ToDo app (there are just a view more left though):

 - ```cr-component```: defines the element being the component's view and it's name. Will be started in the javaScript by calling ```circular.component('my-component', {...})``` where the attribute's value and the first argument of the method call have to match.
 - ```cr-container```: defines the element within the rendering will happen when the component is initialised.
 - ```cr-template-for```: defines the element (only one) that will act as a template for further rendering.
 - ```cr-event```: will install event listeners within the component. The syntax equals an object declaration where the key is the event type and the value would be the function name being defined within the options of you component.
 - ```cr-view```: defines the name of the reference that the components will provide later on inside the model to have easy access to those elements on runtime without having to make ```querySelector```.

Most of those attributes don't have an immediate effect on the view but makes it easy to write effective code inside your component definitions.


CircularJS uses a Handlebars implementation called ```Schnauzer``` that covers about 95% of the features of Handlebars, but it's just a fraction of code-size and up to 20 times faster.
Schnauzer uses ```Blick``` to get references between the Schnauzer template parts that end up in the DOM and CircularJS, so CircularJS can easily update the view(s) on any change of the component's model. This can almost be seen as what Glimmer, used by EmberJS, does.
In your Handlebars-like templates you can now use static variables that are only used the first time of rendering, or dynamic variables defined by the ```%``` sign in front of the variable (```{{#if %foo}}bar{{/if}}```). Those dynamic variables are responsible for keeping the components model and the view in sync (data-binding).
Dynamic variables usually don't trigger a view update if the model changes but the new value equals the old one eccept if the variable is signed with a double ```%%```. This can be useful for example if you need to reset a value of an input field, where the value of the element is always out of sync with what you see while you're typing as the value only get's updated on blur.

In the index.html you will now recognise 2 ```cr-component``` definitions, ```app``` and ```list```, their templates for rendering defined by ```cr-template-for``` and the definition of where the templates should be rendered into defined by ```cr-container``` (which can have a value ```prepend``` if you want to not append but prepend the rendering).

In our case here, we have a very special edge-case situation: Not only the components are nested, which is a quite common case, but also the templates are nested, and this is the reason for the previously mentioned ```cr-container="prepend"``` and the last line of the code in ```app.js```, but I'll get back to this later on.

### The JS code (app.js)

CircularJS provides besides PubSub, routing, ajax, promise, resource-loader and a lot of other tools also an AMD-module loader, and there we explained the first line of code.
The following lines are just some variable declarations fo literals and then on line 12 we now define our first component, The list of TODO's, which is the nested component inside the UI, or 'app' component.
As mentioned in the "Template" section, we have a HTML element with the attribute ```cr-component="list"``` that waits to be initialiced by ```const list = circular.component('list', {...});```.

Side Note: Components can be used to
 - just keep track of a state and maybe react on events on the UI and not render anything else,
 - render a single model item like we do in the following explained "app" component,
 - render a list of items re-using the same template over and over again or
 - render nested items like you would find in a menu-tree, category tree or actually a DOM-tree.

A very common use case of building components is by feeding it a ```model```, that might be used for rendeing or just as a state model (but you should always think of it as a state model), the ```listeners``` that define the parts of the model we want to react on if they change (in our case it is all ```*```), ```subscribe```, the callback function that get's called in case a mdel property we're listening to has been modified and finally ```eventListeners``` where you can place all your event listener callback functions you defined in your template with ```cr-event```. That's pretty much it.

A best practise rule would be to try to only use ```eventListeners``` callbacks to set variables of the model unless you don't track view elements in you state-model but need to do something with it.
All the callbacks will rpvide you with the event, the DOM-element of the rendered item and the model-item.
If you look at the event listeners, it is probably very obvious what they do, and if you follow the template side by the JS, you can probably easily figure out how those model changes effect the view. So, I guess I don't even have to give further explainations here.
Maybe ```item.editable = ''``` and ```item.editable = 'focus'``` needs some further explainations:
In "Blick" there are some attributes defined that not only change their values on a model change but do a bit more. We're now talking about boolean DOM-Element attributes: disabled, checked, autocomplete, selected, ...
In case of the value of ```disabled=""``` receives a falsy value (here defined by ```item.editable```), the attribute doesn't get the value but the attribute is actually removed. In case of a truethy value, the attribute looks like ```disabled=""``` or ```disabled```. In the special case of the ```disabled``` attribute you can pass it a value of ```focus``` which will remove the attribute but also calls ```.focus()``` on the element.

The ```subscribe``` callback get's fired as soon as the model changes a registered property. In case of the ```text``` being changed, the variable ```editable``` will be changedd, so the input field blurs and hides, otherwise we trigger an update of the UI (in case we toggled a todo item).
If the text changed or the toggle was triggered, the list-component's model gets saved to the local storage by calling ```storage.saveLazy(list.model, STORAGE_KEY);```

The following function ```updateUI()``` is used to update the next component and won't be explained here as it will be very clear what it does when we go throug that next component ```circular.component('app', {...})```

To be continued....
