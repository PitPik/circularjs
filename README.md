![CircularJS](assets/circularjs-logo.png)

See some demos right away @ [pitpik.github.io/circularjs](https://pitpik.github.io/circularjs/).
or go straight to the [API documentation](documentation/API.md).

# What is CircularJS

I know, yet another MVC/MVVM framework... ***but***

## What we expect from a front-end MVC/MVVM Framework

- Code base of framework is **small** (57.2 kB minified, 20.8 kB gzipped) so that it...
- **Loads/Initialises** as **fast** as possible (mobile / tablet)
- **Starts/Renders** the app as **fast** as possible
- **Fast** adding/removing items into/from the view (fast **DOM manipulation**)
- **Fast changing** items in the view (also fast DOM manipulation)
- Make it possible to keep **App/Code** as **small** as possible
- **Coding/Complexity** as **simple** as possible
- Keeps a healthy balance between **coding convenience**, **flexibility** and **restrictions/opinionation**
- Quick and **easy to learn**

There are immediately some confrontations with those arguments when creating a MVC/MVVM Framework as it is not easy or possible to **address all of those expectations** at the same level. Usually, when trying to get one of them perfect, some other point suffers from it.

**CircularJS** though does a pretty good job in finding the **perfect balance** between all of those **expectations**.
It is very small though has **all the features** you would expect from a MVC/MVVM Framework and is **"pluggable"** for all the features you need to add to your project. Your code base can be kept **very small** and it renders **blasting fast** without having to face compromises so it's perfectly suitable for apps on **mobile/tablet/smart TV/PIs** etc.

Understanding how things work and learning the way of working with **CircularJS** is based on **well known technology/patterns** and therefore **"really" easy to learn**. Most provided APIs that are **CircularJS** specific are done in a way so you get familiar with quite fast as they are based on logic/patterns from **known APIs** (like the DOM API, etc.).

Maybe the biggest difference to most of the other MVC frameworks (let's call them like this...) is that **CircularJS** doesn't need any pre-compilation. It's all native and therefore runs from your folder you create your app in. The atvantage is that you don't need to learn a lot of framework specific things as it's all native. Even the templates actually render in a browser what **CircularJS** also uses to make the browser's API help rendering them as fast as possible. It lets the browser do the heavy lifting as it's always faster than written code. You may ofcourse use TypeScript or LESS or SCSS that needs to be pre-compiled, but... you don't need to. **CircularJS** components could even be used inside other frameworks like Angular etc.

## A minimal example

```js
require(['circular', '!app.html'], ({ Component }, template) =>

Component({
  selector: 'app',
  template: template,
},
class myApp {
  count = 0;

  click(e, elm, item, model) {
    this.count++;
  }
}))

```

The `app.html`


```Handlebars
<button cr-event="click">
  Count is: {{%count}}
</button>
```

The above example demonstrates the three core features of **CircularJS**:

- **Declarative Rendering**: CircularJS extends standard HTML with a Handlebars template syntax that allows us to declaratively describe HTML output based on JavaScript state.

- **Reactivity**: CircularJS automatically tracks JavaScript state changes and efficiently updates the DOM when changes happen.

- **CircularJS** doesn't need to be pre-compiled due to it's own smart component loader **amd.js** and because it even uses the browser itself to parse the templates in the rendering engine **Blick**, it is **all native**.

Just run your code from within a folder served by your favourite WEB-Server (pre-installed on your OS). 

You may already have questions - don't worry. We will cover every little detail in the rest of the documentation. For now, please read along so you can have a high-level understanding of what CircularJS offers.

> **Prerequisites**
>The rest of the documentation assumes basic familiarity with HTML, CSS, and JavaScript. If you are totally new to frontend development, it might not be the best idea to jump right into a framework as your first step - grasp the basics and then come back! You can check your knowledge level with [this JavaScript overview](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Language_Overview). Prior experience with other frameworks helps, but is not required.

## What you will deal with when working with/learning CircularJS

If you know your **JavaScript**, **common patterns** as **Promises**, **ajax**, **PubSub**, **Array methods**, **Handlebars**, **AMD** ... then you cover 70% of the API already, if you ever worked with Angular, it's probably about **90%**. So, **not much new to learn**.

See the complete list of functionality in the [Table of Contents](documentation/TOC.md) linking to all the documentations

In my opinion, **learning CircularJS in one day** is easily possible. Working with a new pattern system / framework although is always a matter of getting used to, although **CircularJS** tries to keep the logic behind it **as simple as possible**. Also, when coming from the Angular side, you will appreciate the **similarity** to it and learn to work with it in no time at all.

See **[API documentation](documentation/API.md)** for more information/documentation.

## Quick Start

To quickly get started go to [Demo page](https://pitpik.github.io/circularjs/) or try the ["Tour of Heroes" tutorial](https://pitpik.github.io/circularjs/demos/heroes/), see the [TODO list demo](https://pitpik.github.io/circularjs/demos/todo) and/or [API documentation](documentation/API.md) for a better overview.

## Why CircularJS

The intention to build **CircularJS** was to create something **small and fast** that is **easy to learn** and feels closer to javaScript rather than having to learn a new language or complicated framework dependent patterns.
Using **CircularJS** is quite easy and straight forward but it provides a lot of power to create strong UIs.
It is **closer to JavaScript** and therefore **easier to learn** and understand. The fact that is uses **plain HTML** files as templates and CSS files for styling makes it even more convenient to get started as those disciplines are known already. This way you can even split effort of design and programming in a project (HTML/CSS part and the JavaScript part).

As mentioned above, **CircularJS** works in a **native** way, so it doesn't need any pre-compiling and doesn't have any specific APIs for templating or coding. This makes things internally as well as for developers way easier. Less APIs to learn (all native JS, HTML, CSS), less effort/problems packaging and deploying...

This may sound like a compromise to speed as SSR might be faster. It isn't though as **Schnauzer** parses so fast that you won't recognice a difference, and parsing would be the only reason for SSR. In fact, it parses as fast as it renders, so if you have a list of 100 items being rendered it then has the speed of 101 times being rendered... and we're talking about nano seconds here. The fact that **Schnauzer** is also "tiny" compared to other frameworks it will be ahead for "first time rendering" anyhow. Even complex apps won't flicker when refreshing the browser.

## CircularJS API

See [API documentation](documentation/API.md) for more information/documentation or see the [Table of contents of all API features](documentation/TOC.md) to get an idea of all the features CircularJS offers.
