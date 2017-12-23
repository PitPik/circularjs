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

## app.js

The component "app" is created to keep track of the app's state.
The according model holds `title` (won't change) and `currentApp`.
The component listens to the changes to `currentApp` and will then
call `renderModule()` to append the module inside the set container.
`renderModule()` also gets the `previousName`, the previous module
that it then will hide from the view. There is also `require`, the
js-module that will be loaded and executed to start the new module.

`onInit` gets executed once to render the headline which view is
defined in the template.

The router is triggered by the links in the HTML page and just
re-defines the "app" component's `currentApp`.


## dashbord.js

This file is part of a module, the HTML and it's resources. This
module returns a initialisation function `init`. The purpose of
this component inside `init` is only to render the first 4 items
in the hero list that we get via `heroService.getHeroes()`.

The rest of the module is defined in the HTML file (index.html)


 ## search.js

"heroes-search" is a component that has only one purpose. It
holds a view of an input field that listens to keyUp that triggers
`search()`. This function tells heroService to look for heroes
via `searchHeroes()` that again triggers `setupList()`.

`setupList()` creates or updates the "heroes-search-list" component
that gets rendered underneath the previous mentioned input field.
The list also listens to click so it can reset the view to an empty
list and empty the input field via `resetSearch()`.


## detail.js

"hero-detail" is the component that listenes to mouse event of
htree different HTML-Elements: the input field for renaming the
current hero, the 'save' button and the 'go back' button and
referring to the according functions.

`updateName()` adds `name` to the model and updates the view
`name` on key up, which is the headline.

`updateHero()` is called when the form is submitted and then
adds a new hero or updates a hero via `heroService.updateHero()`

The router's callback gets according to 'detail/id' the hero model
and then replaces the model of "hero-detail" so it can re-render
automatically.


## heroes.js

"heroes" is the component that listens to the form for adding
heroes by calling `addHero()`.
`addHero()` tells `heroService` to add a hero and then clears
the form and appends the new hero to the "heroes-list".

"heroes-list" is created on init as its wrapped function is
returned as an initiation function and gets called when the
whole module is (re-)loaded.
The items in the "heroes-list" have an eventListener on click
to delete items with `deleteHero()`.

`addHero()` and `deleteHero()` use VOM's API to manipulate the
model in "heroes-list" to append and remove children that then
triggers a re-rendering automatically.

