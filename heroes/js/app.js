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
