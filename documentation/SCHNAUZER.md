# Schnauzer API

**Schnauzer** is a **Handlebars** implementation in JavaScript. It is different though to others as it is not only designed for rendering a model **one time only** but has a special **internal API** to get a hold on all placeholders of the template including loops so they can be updated individually at any time. The template **stays dynamic** the whole time of the components live.

This part of the documentation only covers **CircularJS** specific behaviour of **Schnauzer**. The complete documentation for **Schnauzer** can be found at the [Schnauzer repository](https://github.com/PitPik/Schnauzer) in case you're not too familiar with the Handlebars syntax.

## Special features

**Schnauzer**, **Blick** and **VArray** play together as **the "rendering engine"**. **VArray** as the view model generator and **Blick** as the orchestrator to the DOM model so that the **Schnauzer** templates are representing all relevant DOM Nodes served by the view model data at any time.

**CircularJS** uses this rendering engine in a smart way so you get some convenient features to work with.

### Dynamic variables

The `%` (or `%%`) infront of variables in templates makes them dynamic, or in other words: This part of the template can be changed at any time by just updating the variable.

```Handlebars
This is some {{%value}} thing.
```

This way, the `this.value` variable inside the component can be changed and it will immediately be visible in the view.
The view only changes when the variable changes. If it should be re-rendered even if the value gets set but not changed then use a double `%%`.

```Handlebars
This is some {{%%value}} thing.
```

All those changes can be subscribed to in the component with the `subscribe$: {}` option and there corresponding methods `this$()` described in the main [API documentation](API.md).


### HTML attributes

**Schnauzer** placeholders can also be used inside attributes.

```Handlebars
<div class="my-class {{%class}}{{#if %isOpen}} open{{/if}}">
```

This way, when the variable `isOpen` is truethy, the class `open` would be rendered as well. The variable `class` can be rendered without a block notation if it's just a string.

Special attributes like `disabled`, `readonly`, `value` etc. need a special treatment as they act in a very specific way in the DOM, especially when updated after the first rendering. To avoid mistakes and make things esaier to work with, **Blick** offers special functions for the following attributes:

- value
- disabled
- hidden
- checked
- autocomplete
- contenteditable
- readonly
- required
- selected

Example: `<button disabled="{{#if %disabled}}true{{/if}}">...</button>`.
If the variable `disabled` would be falsy, the attribute would disapear  all together.

Those functions can be overwritten or defined for other attributes globally in the options definition of the **CircularJS** instanciation or with any component definition. For further information see [#Circular.component in API documentation](API.md#circularcomponent).


### The partial `@content`

This is a special **Schnauzer** partial that gets created when there is text inside a component tag.

```Handlebars
<my-component>
  This is some text: {{%foo}}
</my-component>
```

In your component, this created partial can be used anywhere in the template, even be the only part of the template like `{{>@content}}`. This can be used when parts of the template in your component should be variable or for example when the main app would be simpler to keep inside the `index.html`.

The `{{%foo}}` variable in this example has the context of the `<my-component>` not the context of where its written.


### Helper variables

#### `@index`

This is a regular Handlebars helper but in **Schnauzer** together with **Blick**, this helper can be used with the `%` notation, so every time some items get moved (list, table, tree, ...), changed, deleted, sorted etc. the `{{%@index}}` gets updated automatically (just like the following helpers).

As there is no model that is reachable for the developer, this variable can only updated by manipulating the view model. Same for the following helper variables.

#### `@number`

Other than other Handlebars implementations, **Schnauzer** has a `@index` like helper variable but "human readable" ;). Its the index + 1. Good for lists etc.

Use dynamically as `{{%@number}}`.

#### `@key`

Same as `@index` but then the key of an iterated object (instead of an Array).

Use dynamically as `{{%@key}}`

#### `@odd`

`true` if `@index` is an odd number, otherwise `false`.

Use dynamically as `{{#if %@odd}} ... {{/if}}`. There is no `even` as `odd` can be use with `{{else}}` or `{{#unless}}`.

#### `@first`, `@last`

Boolean for items in iterated Arrays or Objects.

Auto updates when used like `{{#if %@first}} ... {{/if}}` and `{{#if %@last}} ... {{/if}}`.

#### `@length`

The length of Arrays or Objects.

Auto updates when used like `{{%@length}}`. Mostly not used in templates but inside helper functions.

#### `@depth`

Index based number of depth of the view model when using child nodes. Can be used for rendering "flat trees", so when you want to render a deep model structure without creating a deeply nested HTML structure.

Auto updates when used like `{{%@depth}}`.


### Recursive templates

Not special for **Schnauzer** but still worth metioning is the way you can build tables and trees. Build a list is easy as you just need a `{{#each list}}` but rendering a tree needs some recursion.

Lets say we have a variable `this.tree` that represens a tree structure that has `chilren: []` as its branches:

```Handlebars
{{>tree chilren=tree}}

{{#*template "tree"}}
  <ul>
    {{#each %children}}
    <li>
      {{%title}}
      {{>tree}} <!-- this is the recursive part -->
    </li>
    {{/each}}
  </ul>
{{/template}}
```

This would be the simplest implementation of the tree. If you want to avoid `<ul>`s being when there are no children, then just wrap the partials with an `if` like `{{#if %tree}}{{>tree chilren=tree}}{{/if}}` and `{{#if %children}}{{>tree}}{{/if}}`.

Other than in Handlebars you can use the word `template` in  `{{#*template ...}}` or any other word that seems logic to you.

The `chilren=tree` in `{{>tree chilren=tree}}` helps the template/inline-partial to have to deal with one variable only.

It also doesn't matter where in the template you define the inline-partial. The only limitation: inline-partials don't work (yet) when defined inside the component tags ([as described above](#content))

### Helper functions

Also not special for **Schnauzer** but good to know: Helper functions can do a lot for you and can also have dynamic variables included. Think of **dynamic Routes** or `<img>` tags that should actually wrapped with `<picture>` tags. Helpers can do all the heavy lifting for you in a blink.

Think of Angulars' `rawSrc="https://my.domain/300/300"`

```Handlebars
<img src="{{picture 'https://my.domain/300/300'}}">
```

Inside your helper function `picture` you can do all you need to have a nice setup for an image for different display/device scenarios.

Or thinking of Routes where you need to use javascript to avoid hashes in your links.

```Handlebars
<a href="{{router 'my/path/to'}}">
```

There are no pre-defined helpers yet to do the most obvious things like links and images yet, but I will come up with some useful helpers soon.