# ![RealWorld Example App](logo.png)

> ### CircularJS codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.


### [Demo](https://pitpik.github.io/circularjs/conduit/src)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/PitPik/circularjs)


This codebase was created to demonstrate a fully fledged fullstack application built with **CircularJS** including CRUD operations, authentication, routing, pagination, and more.

We've gone to great lengths to adhere to the **CircularJS** community styleguides & best practices.

For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.


# How it works


CircularJS lets you write small and fast components and modules (widgets).
```app.js``` is the starting point where the first component 'app' is built with its state model and a router that switches the state. The change of the state causes the moduleLoader to fetches the modules (widgets) and renders them in the dedicated container.

All the modules again use components to render the templates.

There is a central data service ```app-data.srv.js``` that provides all the REST calls needed for the modules for getting and setting data to and from the server.

Some components look a little clumsy as I chose not to use templating there (main menu, article menus) as the HTML file can be easier be translated to other languages on the server. For example the words 'My Articles' and 'Favorited Articles' could be again wrapped with Handlebars so the server can choose the correct translation. This way this whole app is already prepared to run in multiple languages... although, there might be better approaches to achieve the same thing.

# Getting started

Put ```src``` folder inside your server's documents root and run it (no npm, no dependencies, plain old JS).

The current setup is meant for performance, not for development which can be changed as follows.

Until there is a building cli-tool for CircularJS you have to manually switch to dev mode:

 - Open ```index.html```, go to the bottom and read there what to comment and uncomment.

 ```app.all.min.js``` includes CirculerJS, so no script tag for CirculerJS is needed if you choose that setting (as it is now). With this setting you also don't need ```js/amd.cfg.js``` as all files will be pre-registered inside the AMD-loader.


# Some additions to the [original implementation](https://demo.realworld.io)

 - URL2State "Your Feed" + pagination (browser BACK button gets you back to where you were)
 - URL2State "Global Feed" + pagination
 - URL2State "Tags" + pagination
 - URL2State "My Articles" + pagination
 - URL2State "Favorited Articles" + pagination
 - "Preview Article", "Edit Article" toggle buttons to preview article as rendered markdown
 - Tags in article list and article view are clickable
 - Post dates are rendered in the browser's language format (very slow though)
 - Soft transitions between data load / app re-render (to demo how transitions work in CircularJS)
 - App icon and metadata to install app on an iPad as web-app (demonstrates CircularJS working perfectly for mobile)

