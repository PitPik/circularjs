# CircularJS

CircularJS is a tiny MV* like framework. It's goal is to help building web-apps in a model-oriented easy way by building fast and convenient 2-way data binding with the help of powerfull tools.

## CircularJS provides you with:

* VOM, a Virtual Object Model controller that automatically reacts on changes of properties,
* Schnauzer, a tiny and fast Mustache/Handlebars like template rendering engine (can be replaced),
* an event-listener controller for all UI actions an any other events,
* DOMinator, a controller that automatically connects and syncs the VOM model with the real DOM.
* Full featured PubSub functionality
* Simple Promise implementation (with .all())
* Ajax with automatic CSRF-Token returning a Promise (plus cache)
* Open router for all kinds of purposes
* Toolbox for common functionality like add/remove/toggle/hasClass, event handling, localStorage, cookies, etc.
* Resource loader (for easy component development)

CircularJS combines all those tools to easily abstract app modules and build high performance SPAs.
CircularJS is very small (~7.3KB gZip) and fast and therefore the best joice for mobile apps.

The intention to build CircularJS was to create something small and fast that is easy to learn and feels closer to javaScript rather than having to learn a new language or complicated patterns. Using CircularJS is quite easy and straight forward. It helps you to avoid bad practice patterns usually caused by wrongly set up event listeners, continuous element search in the DOM (also without caching) and using global variables to store information for other components...

## Benefits

* No dependencies to other frameworks.
* Other frameworks may co-exist (AngularJS, jQuery, ...).
* Uses VanillaJS; Usage of VanillaJS welcome.
* Unopinionated.
* No querySelectors like $('..') or querySelectorAll etc. needed in code.
* No class names in JS code needed to find elements (decouples css and JS).
* Constant sync between model, view and server.
* Seperation of model, view and service code.
* Automated event handling (in a memory friendly way).
* Automated view rendering when model changes (even with router).
* Easy destroy for effective garbage collection.
* Fast and easy i18n possible.
* Write little code for powerful solutions.
* Great for mobile apps as it is tiny (~7.3KB) and very fast (~8x to AngularJS).
* Exchangeable rendering engine.
* Keep track of your logic as there is not much magic happening (no digest etc.).
* pubsub for internal or custom events (also set up pubsub for localStorage etc.).

## The usual flow how to built components with circularJS:

 * You create a model that acts like a state controller (key task)
 * You build a template that renders the initial view according to that model
 * You add UI event listeners to the template that get picked up automatically.
   Those event listeners then manipulate the model (the state, not the view)
 * The change of the state triggers a callback that again triggers DOM manipulation according to what state changed (seperation of model and view rendering).
 * To help you find DOM elements later on you can also define them in the template so they get cached in the model for convenient use.
 * Use PubSub, Router or Promisses to change the state (that triggers rendering again...)

## Coming up soon (...)

* cr-event change: automatic model update on input change
* cr-class: automatic class name update due to model change
* auto-model-creation from server-side-rendered view

## APIs

This documentation will be continued soon. For now you can see some demos (also delivered by this repository) to explore how CircularJS works.

* [Simple button demo](http://dematte.at/circularjs/)
* [TODO list demo](http://dematte.at/circularjs/todo/)
* [Nested tree demo](http://dematte.at/circularjs/tree/)

See you soon ;o)
