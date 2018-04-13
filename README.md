# What is CircularJS

CircularJS is a tiny **MV\* like framework** with its goal to help building **web-pages** and **single-page-web-apps** in a **model-oriented** easy way with the help of powerful tools:
 - **amd**: a powerful module loader with look-ahead for even faster resource loading.
 - **ajax**: resource loader with cache, timed cache and auto XSRF returning a promise.
 - **promise**: also used by ajax. A well known design pattern, easy to use.
 - **resource/module loader**: A convenient widget loader with powerful options.
 - **pubsub**: A well known design pattern for transmitting data along the whole app.
 - **router**: an easy but powerful routing system using internal pubsub.
 - **VOM**: a fast and convenient object-model manager. Works like the DOM-API to abstract components from the DOM, also using pubsub for manipulation event handling. The heart of CircularJS.
 - **Schnauzer**: tiny an fast rendering engine (like Handlebars but smaller than Mustache) to reflect VOM models on the fly in combination with the internal **rendering module**. (Replaces Angular like ng-if, ng-class, etc.)
 - **rendering module**: internal module syncing VOM model, using Schnauzer templates, with the DOM-model.
 - **automatic event management**.
 - **automatic DOM-Element reference management**.
 - Enhanced **resource loading management** for parallel loading of data/view/resources/modules(-preload), rtc.
 - Loads of **helper functions** like 'addClass...', '$' and '$$', 'sorter' and many more...

**CircularJS** combines all those tools to easily abstract app modules and build **high performance SPAs**. CircularJS is very small (~9.9KB gZip, 27.5KB) and fast and therefore the best joyce for **mobile apps**.

**CircularJS** is very easy to learn as 60% - 70% of functionality used within the framework like pubsub, ajax, handlebars, amd, promise and even routers and methods like "appendChild", "removeChild" etc. is already known by most developers.

## Quick Start

To quickly get started try the ["Tour of Heroes" tutorial](heroes), see the [TODO list demo](http://dematte.at/circularjs/todo/) and read [ARCHITECTURE.md](ARCHITECTURE.md) and [API.md](API.md) for a better overview.

## Why CircularJS

The intention to build **CircularJS** was to create something small and fast that is easy to learn and feels closer to javaScript rather than having to learn a new language or complicated framework dependent patterns.
Using **CircularJS** is quite easy and straight forward.

When developing **components** and **modules** with **circularJS** you usually don't need to search the DOM any more, so no further selectors needed, never install any event listener and never need to use the global scope for storing app dependent variables. You probably don't even need any other dependencies to manage your views although they might co-exist as **circualrJS** is **highly un-oppinionated**.

You usually end up writing **very little code** to manage big tasks in you SPI's views with powerful functionality.

## Architecture

With **circularJS** you basically develop **components**, **modules** and **services**.
A **component** controls a patch of screen called a view, also used for **state management**, where as **modules** are a compositions of several components in a widget like HTML document that can be rendered inside an existing app or even component.

**Services** are actually not features provided by CircularJS but a logic design pattern to decouple views from business-logic and server synchronization. They can easily be managed through the amd module loader.
See [ARCHITECTURE.md](ARCHITECTURE.md) for more information.

## CircularJS API

See [API.md](API.md) for more information.


For now you can see some demos (also delivered by this repository) to explore how **CircularJS** works.

* ["Tour of Heroes" tutorial](http://dematte.at/circularjs/heroes)
* [Simple button demo](http://dematte.at/circularjs/)
* [TODO list demo](http://dematte.at/circularjs/todo/)
* [Nested tree demo](http://dematte.at/circularjs/tree/)
