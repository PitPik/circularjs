# ![RealWorld Example App](logo.png)

> ### [CircularJS](https://github.com/PitPik/circularjs) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.


### [Demo](https://pitpik.github.io/circularjs/conduit/src)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/PitPik/circularjs)


This codebase was created to demonstrate a fully fledged fullstack application built with **CircularJS** including CRUD operations, authentication, routing, pagination, and more.

We've gone to great lengths to adhere to the **CircularJS** community styleguides & best practices.

For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.


# How it works


[CircularJS](https://github.com/PitPik/circularjs) lets you write small and fast components and modules.
```components/main-app/main-app.component.js``` is the starting point with its state model and a router that switches the state. The change of the state causes the moduleLoader to fetches the components and renders them in the dedicated container `<app-outlet></app-outlet>`.

All the modules again use components to render the templates.

There is a central data service ```js/api.service.js``` that provides all the REST calls needed for the modules for getting and setting data to and from the server.

The "live" example is packed with CirculaJS `package.js` including the `circular.min.js` file (option -cr) and measures only 95k not compressed (31k gZip).

# Getting started

Put folder inside your server's documents root and run it (no npm, no dependencies, plain old JS).

The current setup is meant for performance, not for development which can be changed as follows.

 - Open ```index.html```, uncomment `<script type="text/javascript" src='../circular.min.js'></script>`, then go to the bottom and switch commenting to the 3 script tags. Voilá, you're ready to develop.


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

