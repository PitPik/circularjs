# Tutorial: Tour of Heroes

**!!!!!** The description wasn't yet updated to the new version of CircularJS. **!!!!!** 

The Tour of Heroes tutorial covers the fundamentals of Circular.
In this tutorial you will build an app that helps a staffing agency manage its stable of heroes. See a [live demo here](https://pitpik.github.io/circularjs/heroes)

This basic app has many of the features you'd expect to find in a data-driven application. It acquires and displays a list of heroes, edits a selected hero's detail, and navigates among different views of heroic data.

By the end of the tutorial you will be able to do the following:

 - Use built-in Circular dynamic component loader to show and hide modules and display lists of hero data.
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
<section class="app-{{%currentApp}}">
    <h1>{{title}}{{#if %currentApp}} - {{%currentApp}}{{/if}}</h1>
    <nav class="app-nav">
    <a href="#/dashboard" class="dashboard">Dashboard</a>
    <a href="#/heroes" class="heroes">Heroes</a>
    </nav>
    <div cr-view="app-modules"></div>
</section>
```

The component "AppMain" is created to keep track of the app's state. The according model holds `title` (won't change) and `currentApp`.
The component listens to the changes to `currentApp` and will then call `renderModule()` to append the module inside the set container `cr-view="app-modules"`. This change automatically re-renders the items in the template that use `%currentApp` as a dynamic palceholder.
`require` in `renderModule()` will load and execute the new module.

`onInit` gets executed once the component is rendered and sets up the router.

The router is triggered by the links in the HTML page and just re-defines the "app" component's `currentApp` that again calls `this$` which executes `renderModule()`.


### dashbord.js

```HTML
<div class="module">
    <h2>Top Heroes</h2>
    <div class="grid grid-pad clearfix">
    <a cr-for="heroes" class="col-1-4" href="#/detail/{{%id}}">
        <div class="module hero">
        <h4>{{%name}}</h4>
        </div>
    </a>
    </div>
    <app-search></app-search>
</div>
```

To be continued...


### search.js

```HTML
<section>
    <h4>Hero Search</h4>
    <input id="search-box" cr-view="search" cr-event="keyup: search" />
    <ul class="search-result" cr-event="click: select">
    <li cr-for="searchList"><a href="#/detail/{{%id}}">{{%name}}</a></li>
    </ul>
</section>
```

To be continued...


### detail.js

```HTML
<div cr-template>
    <h2><span cr-view="name">{{%name}}</span> Details</h2>
    <div><span>id: </span>{{#if %id}}{{id}}{{else}}--{{/if}}</div>
    <label>name:
    <input cr-event="input: updateName; keyup: cancel" placeholder="name" value="{{%name}}" />
    </label>
    <button cr-event="click: goBack">go back</button>
    {{#if %dirty}}<button cr-event="click: save" disabled="{{%name}}">save</button>{{/if}}
</div>
```

To be continued...


### heroes.js

```HTML
<div>
    <h2>My Heroes</h2>
    <form cr-event="submit: addHero">
    <label>Hero name: <input name="hero" type="text" /></label>
    <button type="submit">add</button>
    </form>
    <ul>
    <li cr-for="heroList">
        <a href="#/detail/{{%id}}">
        <span class="badge">{{%id}}</span> {{%name}}
        </a>
        <button class="delete" title="delete hero" cr-event="click: deleteHero">x</button>
    </li>
    </ul>
</div>
```

To be continued...
