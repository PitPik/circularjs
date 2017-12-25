# Tutorial: Tour of Heroes

The Tour of Heroes tutorial covers the fundamentals of Circular.
In this tutorial you will build an app that helps a staffing agency manage its stable of heroes.

This basic app has many of the features you'd expect to find in a data-driven application. It acquires and displays a list of heroes, edits a selected hero's detail, and navigates among different views of heroic data.

By the end of the tutorial you will be able to do the following:

 - Use built-in Circular resource loader to show and hide modules and display lists of hero data.
 - Create Circular components to display hero details and show an array of heroes.
 - Use one-way data binding for read-only data.
 - Add editable fields to update a model with two-way data binding.
 - Bind component methods to user events, like keystrokes and clicks.
 - Enable users to select a hero from a master list and edit that hero in the details view.
 - Create a shared service to assemble the heroes.
 - Use routing to navigate among different views and their components.
 - You'll learn enough Circular to get started and gain confidence that Circular can do whatever you need it to do.


## The files from the hero app

The following explanations show the relevant HTML parts while describing the JS functionality.


### app.js

```HTML
<body cr-component="app">
    <h1 cr-view="title"></h1>
    <nav class="app-nav">
        <a href="#/dashboard">Dashboard</a>
        <a href="#/heroes">Heroes</a>
    </nav>
    <div cr-view="app-modules"></div>
</body>
```

The component "app" `cr-component="app"` is created to keep track of the app's state. The according model holds `title` (won't change) and `currentApp`.
The component listens to the changes to `currentApp` and will then call `renderModule()` to append the module inside the set container `cr-view="app-modules"`.
`renderModule()` also gets the `previousName`, the previous module that it then will hide from the view. There is also `require`, the js-module that will be loaded and executed to start the new module.

`onInit` gets executed once to render the headline which view is defined in the template by `cr-view="title"`.

The router is triggered by the links in the HTML page and just re-defines the "app" component's `currentApp`.


### dashbord.js

```HTML
<div class="grid grid-pad clearfix" cr-component="heroes-dashboard" cr-container>
    <script type="text/template" cr-template-for="heroes-dashboard">
    <a class="col-1-4" href="#/detail/{{id}}">
        <div class="module hero">
            <h4>{{name}}</h4>
        </div>
    </a>
    </script>
</div>
```

This file is part of a module, the HTML and it's resources. This module returns a initialisation function `init`. The purpose of this component ```'heroes-dashboard'``` inside `init` is only to render the first 4 items in the hero list that we get via `heroService.getHeroes()`. The template ```cr-template-for="heroes-dashboard"``` gets rendered automatically according to the model in the component.

The rest of the module is defined in the HTML file dashboard/index.html.


### search.js

```HTML
<div cr-component="heroes-search">
    <h4>Hero Search</h4>
    <input id="search-box" cr-view="search" cr-event="keyup: search" />
    <ul class="search-result" cr-component="heroes-search-list" cr-event="click: select" cr-container>
        <script type="text/template" cr-template-for="heroes-search-list">
        <li><a href="#/detail/{{id}}">{{name}}</a></li>
        </script>
    </ul>
</div>
```

"heroes-search" is a component that has only one purpose. It holds a view "search" of an input field that listens to keyUp that triggers `search()`. This function tells `heroService` to look for heroes via `searchHeroes()` that again triggers `setupList()`.

`setupList()` creates or updates the "heroes-search-list" component that gets rendered underneath the previous mentioned input field inside its container defined with ´cr-container´.
The list also listens to click (triggers `select()`) so it can reset the view to an empty list and empty the input field via `resetSearch()`.


### detail.js

```HTML
<div cr-component="hero-detail" cr-container>
    <script type="text/template" cr-template-for="hero-detail">
    <div>
        <h2><span cr-view="name">{{name}}</span> Details</h2>
        <div><span>id: </span>{{id}}{{^id}}--{{/id}}</div>
        <label>name:
            <input cr-event="keyup: updateName" placeholder="name" value="{{name}}" />
        </label>
        <button cr-event="click: goBack">go back</button>
        <button cr-event="click: save">save</button>
    </div>
    </script>
</div>
```

Component "hero-detail", rendered by passing the model of the hero, is the component that listenes to mouse events of three different HTML-Elements: the input field for renaming the current hero triggereing `updateName()`, the 'save' button and the 'go back' button and referring to the according functions `goBack()` and `save()`.

`updateName()` adds `name` to the model and updates the view `name` on key up, which is the headline.

`updateHero()` is called when the form is submitted and then adds a new hero or updates a hero via `heroService.updateHero()`.

The router's callback gets according to 'detail/id' the hero model and then replaces the model of "hero-detail" so it can re-render automatically.


### heroes.js

```HTML
<div class="module" cr-component="heroes">
    <h2>My Heroes</h2>
    <form cr-event="submit: addHero">
        <label>Hero name:
            <input name="hero" type="text" />
        </label>
        <button type="submit">add</button>
    </form>
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
</div>
```

"heroes" is the component that listens to the form for adding heroes by calling `addHero()`.
`addHero()` tells `heroService` to add a hero and then clears the form and appends the new hero to the "heroes-list".

"heroes-list" is created on init as its wrapped function is returned as an initiation function and gets called when the
whole module is (re-)loaded.
The items in the "heroes-list" have an eventListener on click to delete items with `deleteHero()`.

`addHero()` and `deleteHero()` use VOM's API to manipulate the model in "heroes-list" to append and remove children that then triggers a re-rendering automatically.

