# CircularJS

CircularJS is a tiny MVC like framework. It's goal is to help building web-apps in a model-oriented easy way by building fast and convenient 2-way data binding.

## CircularJS provides you with:

* VOM, a Virtual Object Model controller that automatically reacts on changes of properties,
* Schnauzer, a tiny and fast Mustache/Handlebars like template rendering engine (can be replaced),
* an event-listener controller for all UI actions an any other events,
* DOMinator, a controller that automatically syncs the VOM model with the real DOM.

CircularJS combines all those tools to easily abstract app modules and build high performance SPAs.
CircularJS is very small (~5.5kBytes gZip) and fast and therefore the best joice for mobile apps.

The intention to build CircularJS was to create something small and fast that is easy to learn and feels closer to javaScript rather than having to learn a new language or complicated patterns. Using CircularJS is quite easy and straight forward. It helps you to avoid bad practice patterns usually caused by wrongly set up event listeners, continuous element search in the DOM (also without caching) and using global variables to store information for other components...

## Coming up soon

* cr-class: automatic class name update due to model change
* cr-event change: automatic model update on input change

## APIs

This documentation will be continued soon. For now you can see some demos (also delivered by this repository) to explore how CircularJS works.

* [Simple button demo](http://dematte.at/circularjs/)
* [TODO list demo](http://dematte.at/circularjs/todo/)
* [Nested tree demo](http://dematte.at/circularjs/tree/)

See you soon ;o)