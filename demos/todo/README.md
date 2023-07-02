# MVC-Todo app complying to the TodoMVC specs on todomvc.com

## How it works (in the scope of newcomers to CircularJS)

Working with CircularJS is fairly easy. You basically create a component that defines a view and holds its model right there as well. You then just need to keep the model up-to-date and the view renders accordingly.
In our case of the TODO app, we decided to keep both views, the app view and the list view, in one component as the code is quite short anyways (~75 effective lines of JavaScript). So, we define the components' variables to keep the app view alive and a variable `list` for the list view in this single component. This then gets all reflected in the Schnauzer template an kept "alive" with Blick.

In the TODO app the view model(s) get(s) updated by user events (mouse events), so we actually only update the view models from there... and that's basically it :)

As the app doesn't really talk to any back-end but to the local storage, this part of storing data is quite simple as well.

### The component (the app)

This component gets set up by `App`. Ususally we use `Component` to create components but as this is the starting point, we can use `App` so it also initializes without having to do anything else.

This function receives the configuration and the class as parameters and creates a component out of it that can be initialised at any time. In this case, as it's defined by `App`, automatically by finding a HTML tag in the index.html file that matches the `selector`.

The template uses a special partial `@content` that takes the HTML inside the app tag as template.

The configuration `subscribe$: { 'list:': [] },` makes the component render the items inside `list` as the todo items and registers changes on the variable itself and the items of it.

The rest of the variables inside the `constructor()` are meant for the view of the app whereas the method `updateUI()` takes care of all those variables to be in sync.

### The template

The template for the app, as mentioned before, sits in our case inside the `<todo-app>` tags of the index.html file.
There are only 2 special attributes used in here: `cr-cloak` and `cr-event`. `cr-cloak` is probably known by other frameworks, an attribute that can hide a component until it's fully rendered in the background, and `cr-event`, the attribute that defines the event listeners for the HTMLElement.

All the other "magic" is done with Schnauzer, a Handlebars implementation for JS that has the same rules like Handlebars has, with just some small differences; the `%` that makes variables listen to changes with Blick.

If you know Handlebars and look at the template, you will imediately recognise what is going on and how it works.

## Conclusion

As you can see, making SPAs or just dynamic Web-pages is quite straight forward. The JavaScript you need mostly just takes care of the state model to be up-to-date and the dynamic template takes care of the rest - the rendering. And there is no difference in how to think about the template rendering the first time and later on when the model changes as it is the same logic, it just differs by adding the "%" to the dynamic variables.

CircularJS has a lot more powerful tools not shown in this fairly easy app that are as easy to understand and use.

## Comparison to other frameworks

CircularJS is closer to real JavaScript than other frameworks and less oppinionated, that's why you don't have to learn that much about framework dependent features that are in my oppinion most of the times restrictions to your ideas. You're more flexible in how to solve problems and don't have to work around oppinionated restrictions.

To make something like AngularJS's features, directives or services you can always create your JavaScript components using ```define``` and ```require``` to create reusable components, but then JavaScript components, that might even be used in plain javaScript projects or other frameworks. CircularJS doesn't limit you in how to think about components and also doesn't want to remind you to componentise. This is up to you. This will stay your responsibility.
