define('app', ['circular'], function(Circular) {
    'use strict';

    var circular = new Circular(),
        appModel = {
            title: 'Tour of Heroes',
            currentApp: ''
        };

    circular.component('app', {
        model: [appModel],
        listeners: ['currentApp'],
        subscribe: function(property, item, value, oldValue) {
            value !== oldValue && circular.renderModule({
                name: value,
                previousName: oldValue,
                path: 'modules/' + value + '/index.html',
                container: item.views['app-modules'],
                require: 'app-' + value
            });
        },
        onInit: function(component) {
            appModel.views.title.textContent = appModel.title;
        }
    });

    circular.addRoute({
        path: '(/:appName)(/*)',
        callback: function(data) {
            appModel.currentApp = data.parameters.appName;
        }
    }, true);
});

/**
 * The component 'app' is created to keep track of the app's state.
 * The according model holds 'title' (won't change) and 'currentApp'.
 * The component listens to the changes to 'currentApp' and will then
 * call 'renderModule()' to append the module inside the set container.
 * 'renderModule()' also gets the previousName, the previous module
 * that it then will hide from the view. There is also 'require', the
 * js-mudule that will be loaded and executed to start the new module.
 *
 * 'onInit' gets executed once to render the headline which view is
 * defined in the template.
 *
 * The router is triggered by the links in the HTML page and just re-
 * defines the 'app' component's 'currentApp'.
 */
