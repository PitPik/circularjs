## What is CircularJS

**CircularJS** is a tiny, progressive **MV* like framework** with its goal to help building **web-pages** and/or **single-page-web-apps** in a **model-oriented** easy way with the help of powerful built-in tools.
**CircularJS** is also (truely) very easy to learn as 70% - 80% of the functionality used within the framework like pubsub, ajax, handlebars, amd, promise and even routers and methods like "appendChild", "removeChild" etc. is already known by most developers. If you are familiar with frameworks like Angular(JS) of Ember then you will probably recognise even more known patterns and immediately know how to use them.

## The components of **CircularJS**

**Schnauzer** is, just like HandlebarsJS, a template parsing/rendering engine that provides the power necessary to let you build semantic templates effectively with no frustration based on and largely compatible with Mustache templates.
It takes a template with palce holders and parses it creating a set of functions that just wait for data to come in so it can blastingly fast output the template's text with the placeholders being replaced by the provided data.

**Blick** is a bit like Glimmer, known as the rendering engine of Ember, although it doesn't compose components but instead acts like a plugin for **Schnauzer** to build references between data structure and template sections. It offers a registration callback for CirculaJS to register those reactive variables which helps components in CircularJS to build reactive components like you would find them in Glimmer.

With **CircularJS** you build components that can use templates that reflect a view according to a model you feed it.
Those views can be updated by replacing the whole model, model parts, moving model parts within the model structure (nested model structure, tree structure) or just by 2-way data binding so when properties of a model change, the view will automatically reflect those changes or, if there is an input from a user interface, this will be immediately be reflected onto the model. **CircularJS** can certainly do much more than just building components but you will read about this later on.

**VOM** is the heart of CircularJS. It makes models act like a virtual object model (VOM) by enriching it with methods like you know from the DOM: appendChild, removeChild, insertBefore, ... and also by converting properties of a model into reactive properties so they can react on a change of it's values.
This makes it possible for CircularJS to connect a model through components to a (DOM)view, provided by Schnauzer and Blick, that is always in sync with that same model.
Those models can easily be converted back to it's original structure so they can be used to be sent back to the server without any further sanitation.

There is some more helper components provided by CircularJS that are most likely being used to build componentiesd single page applications (SPIs) or just components or modules: **amd.js** and **toolbox.js**.

**amd.js** is a powerful module loader with look-ahead functionality for even faster resource loading. It provides almost the same logic as requireJS but with some extras you wouldn't want to miss. This tool makes it possible to componenties your code and easily keep track of all your sources. This way you can write slick and clean components. It is also the orchestrator for bundeling and minification.

**toolbox.js** provides you with a lot of tools you might need to write slick code even for older browsers (IE9). Most of the tools are also used inside CircularJS and it's other components. It provides tools like Promise, ajax, DOM manipulation helpers, event registration tools, storage tools, etc. so CircularJS can provide you with even more features like module-resource loader, promise, pubsub, routing, automatic event management and much more.


**CircularJS** combines all those tools to easily abstract app modules and build high performance SPAs or simple web pages.
**CircularJS** is very small (~13KB gZip, 33KB) and blasting fast and therefore the best joyce for mobile apps.
**CircularJS** can optimize apps when used with HTTP 2.0 as you can make your app load all resources at the same time by prefetching all the necessary resources.

