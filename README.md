![CircularJS](assets/circularjs-logo.png)

See some demos right away @ [pitpik.github.io/circularjs](https://pitpik.github.io/circularjs/).
or go straight to the [API documentation](documentation/API.md).

# What is CircularJS

I know, yet another MVC/MVVM framework ;)... but

## What we expect from a front-end MVC/MVVM Framework

- Code base of framework is **small** (57.2 kB minified, 20.8 kB gzipped) so that it...
- **Loads/Initialises** as **fast** as possible (mobile / tablet)
- **Starts/Renders** the app as **fast** as possible
- **Fast** adding/removing items into/from the view (fast **DOM manipulation**)
- **Fast changing** items in the view (fast DOM manipulation)
- Make it possible to keep **App/Code** as **small** as possible
- **Coding/Complexity** as **simple** as possible
- Keeps a healthy balance between **coding convenience**, **flexibility** and **restrictions/oppinionation**
- Quick and **easy to learn**

When creating a MVC/MVVM Framework you are immediately confronted with making compromises between those arguments because it is not easy or possible to **address all of those expectations** at the same level. Usually, when trying to get one of them perfect, some other point suffers from it (most obvious example would be coding convenience vs. rendering performance).

**CircularJS** though does a pretty good job in finding the **perfect ballance** between all of those **expectations**.
It is very small though has **all the features** you would expect from a MVC/MVVM Framework and is **"pluggable"** for all the features you need to add to your project. Even though your code base can be kept **very small** (because in general you really just deal with the view model) it renders **blasting fast** without having to face compromises.
Also a perfect prerequisite for apps on **mobile/tablet/smart TV/PIs** etc.

Understanding how things work and learning the way of working with **CircularJS** is based on **well known technology/patterns** and therefore **"realy" easy to learn**. Most provided APIs that are **CircularJS** specific are done in a way so you get familiar with quite fast as they are based on logic/patterns from **known APIs** (like the DOM API, etc.).

## What you will deal with when working with/learning CircularJS

If you know your **JavaScript**, **common patterns** as **Promises**, **ajax**, **PubSub**, **Array methods**, **Handlebars**, **AMD** ... then you cover 70% of the API already, if you ever worked with Angular, it's probably about **90%**. So, **not much new to learn**.

- **Schnauzer** templating (Schnauzer is a JS implementation of the **Handlebars** standard)
- **Promise** standard (with cancel functionality)
- **PubSub** standard (with "before subscription" data)
- General standard **Router** functionality
- **Ajax** with cancel (as it uses Promise as described above)
- **15 methods** on circular (most of them for PubSub and Routing, the rest for dealing with components)
- **5 simple static methods** on Circular (mostly only 1 is needed, like Decorators "Component" known from Angular)
- **8 additional methods** on model arrays
- **5 CircularJS specific attributes** on DOM elements (for event handling, lazy loading, etc.)
- **7 pre-defined methods** in/for components (life-cycle methods like onInit, onDestroy, onChanges, etc.)
- **AMD** Module loader
- Some **configurations** if needed at all (options, amd, etc.)

In my oppinion, **learning CircularJS in one day** is easily possible. Working with a new pattern system / framework although is always a matter of getting used to, although **CircularJS** tries to keep the logic behind it **as simple as possible**. Also, when coming from the Angular side, you will appreciate the **similarity** to it and learn to work with it in no time at all.

See **[API documentation](documentation/API.md)** for more information/documentation.

## Quick Start

To quickly get started go to [Demo page](https://pitpik.github.io/circularjs/) or try the ["Tour of Heroes" tutorial](heroes), see the [TODO list demo](https://pitpik.github.io/circularjs/todo) and/or [API documentation](documentation/API.md) for a better overview.

## Why CircularJS

The intention to build **CircularJS** was to create something **small and fast** that is **easy to learn** and feels closer to javaScript rather than having to learn a new language or complicated framework dependent patterns.
Using **CircularJS** is quite easy and straight forward but it provides a lot of power to create strong UIs.
It is **closer to JavaScript** and therefore **easier to learn** and understand. The fact that is uses **plain HTML** files as templates and CSS files for styling makes it even more convenient to get started as those disciplines are known already. This way you can even split effort of design and programming in a project (HTML/CSS part and the JavaScript part).

## CircularJS API

See [API documentation](documentation/API.md) for more information/documentation.
