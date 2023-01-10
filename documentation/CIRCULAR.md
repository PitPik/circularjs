# CircularJS instances

At the time when components are defined there is a common instance already available or you can create a custom instance yourself. The instance of circular will get presented to you in the `constructor()` of your component classes and in the `onInit()` and `onLoad()` methods of your component, but can also be imported via `circular`.

```JS
require(['circular'], ({ Component, circular }) => {});
```

The instance offers quite some usefull methods to manage your apps.

- createComponent
- getChildComponents
- getParentComponent
- hideComponent
- destroyComponent

- triggerEvent
- installEvent
- getView
- subscribe
- publish
- unsubscribe
- addRoute
- removeRoute
- toggleRoute

