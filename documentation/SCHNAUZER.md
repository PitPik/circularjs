# Schnauzer API

**Schnauzer** is a JavaScript **Handlebars** implementation. This implementation though is different from others as it is not only designed to render a model **one time only** but has a special **internal API** to get a hold on all the placeholders of the template including loops so they can be updated individually after the first rendering. The template **stays dynamic** the whole time of the components live.

The documentation for **Schnauzer** can be found at [the Schnauzer repository](https://github.com/PitPik/Schnauzer).

## Special features

**CircularJS** uses **Schnauzer** to serve the rendering engine **blick** in combination with **VArray**, the view model engine, to keep templates dynamic the whole live-cycle of your components.

Therefore ther are features that are special in combination with **CircularJS**.

### Dynamic variables

The `%` infront of variable in templates makes them dynamic.

```HTML
This is some {{%value}} thing.
```

This way, the `this.value` variable inside the component can be changed and it will immediately be visible in the view.
The view only changes when the variable changes. If it should be re-rendered even if the value gets set but not changed then use a double `%%`.

```HTML
This is some {{%%value}} thing.
```

All those changes can be subscribed to in the component with the `subscribe$: {}` option and there corresponding methods `this$()` described in the main [API documentation](API.md).

### @content

This is a special partial that gets created when there is text inside a component tag.

```HTML
<my-component>
  This is some text: {{%foo}}
</my-component>
```

In your component, this created partial can be used anywhere in the template, even be the only part of the template. This can be used when parts of the template in your component should be variable or for example when the main app would be simpler to keep inside the `index.html`.

### Helpers

#### @index

This is a regular Handlebars helper but in **Schnauzer** together with **blick**, this helper can be used with the `%` notation, so every time some items get moved (list, table, tree, ...), changed, deleted etc. the `{{%@index}}` gets updated automatically (just like the following helpers).

As there is no model that is reachable for the developer, this variable can only updated by manipulating the view model. Same for the following helper variables.

#### @number

Other than other Handlebars implementations, **Schnauzer** has a `@index` like helper variable but "human readable" ;). Its the index + 1. Good for lists tec.
Use dynamically as `{{%@number}}`.

#### @key

Same as `@index` but then the key of an iterated object (instead of an Array). Use dynamically as `{{%@key}}`

#### @odd

`true` if `@index` is an odd number, otherwise `false`. Use dynamically as `{{#if %@odd}} ... {{/if}}`. There is no `even` as `odd` can be use with `{{else}}` or `{{#unless}}`.

#### @first, @last

Boolean for items in iterated Arrays or Objects. Auto updates when used like `{{#if %@first}} ... {{/if}}` and `{{#if %@last}} ... {{/if}}`.

#### @length

The length of Arrays or Objects. Auto updates when used like `{{%@length}}`.

#### @depth

Index based number of depth of the view model when using child nodes. Can be used for rendering "flat trees", so when you want to render a deep structure without having to nest deep HTML nodes. Auto updates when used like `{{%@depth}}`.

