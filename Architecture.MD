# Architecture Overview

Circular is a framework for building client applications in HTML and JavaScript.

CircularJS is at this time the smallest and probably fastest MVC framework for SPAs there is although there is no rendering optimization implemented yet. The framework consists of several libraries, all combined to a single minified file.

You write Circular applications by composing HTML Modules with Circularized templates, writing components to manage those templates, adding application logic in services, and boxing components and services in modules.

Circular presents your application content in a browser and responds to user interactions according to the instructions you've provided.

Of course, there is more to it than this. You'll learn the details in the pages that follow. For now, focus on the big picture.

{{PICTURE}}

If you are familiar with the concepts of the DOM-API, Promise, PubSub, Mustage or Handlebars, jQuery ajax and simple routing patterns then you are already familiar with more than half of what you need to know to use circularJS.
The intention to build circularJS was to get a powerful MVC framework that can abstract and handle HTML as it is (without making it what it isn't: markup with magic functionality), build blasting fast SPAs by using patterns one is used to and familiar with. Write less code for powerful and fast interactions with code that is least possible opinionated and logically structured.



## Modules

Circular apps are modular. Every module can be developed standalone taking care of its own dependencies and components and therefore being independent from other modules.

You basically set up a HTML page preferable with all the `<link>` and `<script>` tags/resources defined and use components to build the desired functionality. If you need resources for development only (mocks, css, etc.) you just need to add "cr-dev" to the resource and it will be ignored when being injected.

This page with all its dependencies/resources/templates can then later be injected into the main app by calling circular.renderModule(). This method returns a Promise() that returns the main dependency that was defined in circular.renderModule() that can be a class, a function or anything else you need it to be to start it up. There are actually more methods to inject modules (insertModule, insertResources or loadResource), but this one is the most convenient way.

If there is a previous module defined when calling circular.renderModule() then this module will be detached from the app but still present outside the document so when called again it will be re-rendered faster as all the necessary DOM-Elements are still present and don't need to be re-rendered and re-initialized. You just need to trigger a re-render by passing a new model to the previously mentioned startup component.

With this standard approach you achieve lazy loading of modules which is in most cases the preferred behavior. This means that modules get loaded when you need them but will stay in memory and re-render faster when needed again without re-loading dependencies again.
You can though easily set up a functionality to preload parts or all the modules, components and/or dependencies right after the first appearance of the app screen while the user is still receiving the first impressions of the rendering. This way the user will not experience any waiting time at all right from the beginning.

There is even a "look-ahead" functionality to faster load dependencies of dependencies.

You'll be using define() and require() from amd.js as you're probably already familiar with by previously already having been used requireJS or other AMD resource loaders. This is a very convenient way to modularize and reuse code. Packing and minifying code to big junks is the logic consequence and very easy to do with amd.js if you need to speed up download times without the need to change all your setups.



## Components / Services

A component controls a patch of screen called a view.
For example, the following views are controlled by components:

 - The app root with the navigation links.
 - The heroes dashboard and the search as seperate component.
 - The list of heroes and the "add hero" form as seperate component.
 - The hero editor.

You define a component's application logic—what it does to support the view—with the circular method component(). This method interacts with the view by listening to the properties of a model that was passed to it. You can define which properties should be listened to and subscribe to it with a callback function.
CircularJS finds the component representation in your HTML document by names defined with the attribute "cr-component".

This is driven by VOM (virtual object model) that is also easily managing nested models like you would find in a tree. VOM, and therefore also the component, has a lot of methods you alredy know by working with the DOM-API. Methods like appendChild(), prependChild(), insertBefore() and removeChild() are probably already very familiar to you. Using those methods also takes care of nested model structures and circular will render them automatically right after receiving the model.

component() receives a lot of mandatory and optional properties with those you can set up you component in a very flexible and easy way. Some options are taken from the options passed when instanciating Circular() if not defined in component().
See the API documentation for details.

A component also keeps track of (automatically installed) event-listeners defined with "cr-event" and pointers to DOM-Elements defined with "cr-view" attributes inside the templates to easily realize one or two way data binding in combination with the subscribers mentioned earlier.



## Templates

You define a component's view with its companion template. A template is a form of HTML that tells Circular how to render the component or parts of it.

A template looks like regular HTML (can also be wrapped in <script> tags) except for a few differences. Some attributes in tags are circular related, they always begin with a "cr-" if not other defined in the options, and some schnauzer.js related parts (only inside <script> tags) have curly brackets like {{heroes}}. Schnauzer.js is a fast and tiny template rendering engine using templates similar to Mustage or Handlebars.
The "cr-" attributes (cr-component, cr-template, cr-event, cr-view, ...) have direct influence to the component model and it's internal setup whereas Schnauzer templates are only used to render views.

```HTML
<h2>Hero List</h2>

<p><i>Pick a hero from the list</i></p>
<ul class="heroes" cr-component="heroes-list" cr-container>
    <script type="text/template" cr-template-for="heroes-list">
    <li cr-id={{cr-id}}>
        <a href="#/detail/{{id}}">
            <span class="badge">{{id}}</span> {{name}}
        </a>
        <button class="delete" title="delete hero" cr-event="click: deleteHero">x</button>
    </li>
    </script>
</ul>

<div cr-view="app-details"></div>
```
Although this template uses typical HTML elements like `<h2>` and `<p>`, it also has some differences. Code like cr-component, cr-id, cr-event, uses Circular's template syntax and {{cr-id}}, {{name}} uses Schnauzer's syntax.

In the last line of the template, the `<div cr-view="app-details">` tag is a regular element that represents a view element in the model of a component. This reference can be used to easily tell circular.renderModule() where to render the details-view module.




## Data binding
Without a framework, you would be responsible for pushing data values into the HTML controls and turning user responses into actions and value updates. Writing such push/pull logic by hand is tedious, error-prone, and a nightmare to read as any experienced jQuery programmer can attest.

Circular supports data binding, a mechanism for coordinating parts of a template with parts of a component. Add binding markup to the template HTML to tell Circular how to connect to the component and use subscribers in the components to connect to the view.

Use "cr-event" to listen to onchange, onsubmit, onkeyup, onclick etc. that will be automatically be picked up by the component. Use "cr-view" to change the DOM-Element pointed to or update the model to re-render the view.

```HTML
<h2><span cr-view="name">{{name}}</span> Details</h2>
...
<label>name:
    <input cr-event="keyup: updateName" placeholder="name" value="{{name}}" />
</label>
```
On keyup on the input field the component's listener callback "updateName" gets called where you then can update the `<span cr-view="name">` view by setting the model's views.name.textContent.
The initial rendering through {{name}} happens when passing the model to the component.

Data binding, 1-way or 2-way, can be realized in many ways. It needs some manual work but therefore you have more control over what happens in your component.
Data binding plays an important role in communication between a template and its component.


## Services
Service is a broad category encompassing any value, function, or feature that your application needs.

Almost anything can be a service. A service is typically a class with a narrow, well-defined purpose. It should do something specific and do it well. 

Examples include:

- logging service
- data service
- message bus
- tax calculator
- application configuration

There is nothing specifically Circular about services. Circular has no definition of a service. There is no service base class, and no place to register a service. You might name your services' files though so you can recognize them right away (heroes.srv.js).

Yet services are fundamental to any Circular application. Components are big consumers of services. Services are everywhere.

Component classes should be lean. They don't fetch data from the server, validate user input, or log directly to the console. They delegate such tasks to services.

A component's job is to enable the user experience and nothing more. It mediates between the view (rendered by the template) and the application logic (which often includes some notion of a model). A good component presents properties and methods for data binding. It delegates everything nontrivial to services.

Circular doesn't enforce these principles. It won't complain if you write a "kitchen sink" component with 3000 lines.

Services can be made available to components through dependency injection.

## Dependency injection
Dependency injection is a way to supply a class, function or anything else with the fully-formed dependencies it requires. Most dependencies are services. Circular uses dependency injection to provide new components with the services they need.

Dependency injection is as simple as using require() or define() where you define all the dependencies you need for your component.

```js
define('app', ['circular', 'app.srv'],
function(Circular, appService) {
    // build component with Circular and appService
});
```
Of Course those dependencies can rely on any other dependencies again that can be defined the same way.

## Wrap up
You've learned the basics about the six main building blocks of an Circular application:

 - Modules
 - Components
 - Templates
 - Data binding
 - Services
 - Dependency injection

That's a foundation for everything else in an Circular application, and it's more than enough to get going. But it doesn't include everything you need to know. The rest is covered in the API documentation (or soon will be).
