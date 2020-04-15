![CircularJS](circularjs-logo.png)

# What is CircularJS

CircularJS is a tiny, progressive **MV\* like framework** with its goal to help building **web-pages** and **single-page-web-apps** in a **model-oriented** easy way with the help of powerful tools:

 - **Schnauzer**: tiny an fast rendering engine (like Handlebars but smaller than Mustache) to reflect VOM models on the fly in combination with the internal **rendering module**. (Replaces Angular like ng-if, ng-class, etc.)
 - **blick**: a layer in between Schnauzer and VOM to keep templates dynamic and reactive so they can not only serve at initial rendering but also in the live cycle of components.
 It is compareable to Ember's glimmer.js. Ember uses Handlebars to render templates, but Handlebars templates only render once, so glimmer.js kicks in to keep Handlebars templates reactive. Blick does almost the same as glimmer.js and Schnauzer is basically Handlebars. blick.js combines trackable data from VOM and its correspondent HTMLNodes for blasting fast updates.
  - **VOM**: a fast and convenient object-model manager. Works like the DOM-API to abstract components from the DOM, also using pubsub for manipulation event handling. The heart of CircularJS.
 - **amd**: a powerful module loader with look-ahead (auto generateable) for even faster resource loading like components, services, templates, styles,...
 - **router**: an easy but powerful routing system using internal pubsub.
 - **resource/module loader**: A convenient component loader with powerful options.
 - **automatic event management**.
 - **automatic DOM-Element reference management**.
 - Enhanced **resource loading management** for parallel loading of data/view/resources/modules(-preload), rtc.
 - Loads of **helper functions** like 'ajax', 'Promise' with cancel, 'pubsub', 'addClass...', '$' and '$$', 'sorter' and many more...
 - **package.js** to package all files (templates, css and JS files) into a single min.js file (even including circular.min.js if option is set).


**CircularJS** combines all those tools to easily abstract app modules and build **high performance SPAs**. CircularJS is very small (~15.6KB gZip, 42.86KB) and fast and therefore the best joyce for **mobile apps**.

**CircularJS** is very easy to learn as 60% - 70% of functionality used within the framework like pubsub, ajax, handlebars, amd, promise and even routers and methods like "appendChild", "removeChild" etc. is already known by most developers.

## Quick Start

To quickly get started go to [Demo page](https://pitpik.github.io/circularjs/) or try the ["Tour of Heroes" tutorial](heroes), see the [TODO list demo](https://pitpik.github.io/circularjs/todo) and read [ARCHITECTURE.md](ARCHITECTURE.md) and [API.md](API.md) for a better overview.
You can use `starter/` folder to quickly start your own test project.

## Why CircularJS

The intention to build **CircularJS** was to create something small and fast that is easy to learn and feels closer to javaScript rather than having to learn a new language or complicated framework dependent patterns.
Using **CircularJS** is quite easy and straight forward but it provides a lot of power to create powerful UIs.
It is closer to JavaScript and therefore easier to learn and understand. The fact that is uses plain HTML files as templates and CSS files for styling makes it even more convenient to get started as those disciplines are known already. This way you can even split effort of design and programming in a project.

**CircularJS** seems very old fashioned (maybe even out-dated according to the community) as there is no `npm install` that downloads the internet to make it work, there is no cli-tools (well, some node.js files) that creates a project structure that tells you what and how to do things and it is the only way to make your app work, there is no server shipped with it, there is no obligation to use another language than JavaScript (although you may), there is no depenedncies, nothing tells you that you are forced to follow modern design patterns like Observables, Redux, TypeScript, etc. although you may do so if it's serving your project, but it's up to you or your team to decide.
It's just one script tag you need to start creating your reusable components and start creating powerful SPIs with the power of tools you probably already know. This way you also don't need 3 MBytes of code for a "Hello world" example to run. The motto of **CircularJS** is: "keep it simple".
A good example is probably the ["conduit"](https://github.com/PitPik/circularjs/tree/master/conduit) ["demo"](https://pitpik.github.io/circularjs/conduit/) that shows how small, simple and fast you can build quite complex apps with a great preformance.

When developing **components** and **modules** with **circularJS** you usually don't need to search the DOM any more, so no further selectors needed, never install any event listener and never need to use the global scope for storing app dependent variables. You probably don't even need any other dependencies to manage your views although they might co-exist as **circualrJS** is **highly un-oppinionated**. Unlike other monolithic frameworks, **CircularJS** is designed to be incrementally adoptable. The library is focused on the view layer, based on state models, and is easy to pick up and integrate with other libraries or existing projects. On the other hand, **CircularJS** is also perfectly capable of powering sophisticated Single-Page Applications.

You usually end up writing **very little code** to manage big tasks in you SPI's views with powerful functionality.

## Architecture

With **circularJS** you basically develop **components**, **modules**, **plugins** (known as directives) and **services**.
A **component** controls a patch of screen called a view, also used for **state management**. **modules** are the same, they just start automatically and are therefore used as your starting component. **plugins**, in the Angular world known as "directives", have no template and just functionally enhance components or modules.

**Services** are actually not features provided by CircularJS but a logic design pattern to decouple views from business-logic and server synchronization. They can easily be managed through the amd module loader.
See [ARCHITECTURE.md](ARCHITECTURE.md) for more information.

## CircularJS API

See [API.md](API.md) for more information.


For now you can see some demos (also delivered by this repository) to explore how **CircularJS** works.

* [Simple demos](https://pitpik.github.io/circularjs)
* ["Tour of Heroes" tutorial](https://pitpik.github.io/circularjs/heroes)
* [TODO list demo (TodoMVC)](https://pitpik.github.io/circularjs/todo)
* [RealWorld example (conduit)](https://pitpik.github.io/circularjs/conduit)
* [Performance demo (sierpinski)](https://pitpik.github.io/circularjs/sierpinski)
* [Performance test (table update)](https://pitpik.github.io/circularjs/performance)
* [Minesweeper](https://pitpik.github.io/circularjs/minesweeper)
