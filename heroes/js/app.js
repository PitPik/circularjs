define('app', ['circular'], function(Circular) {
    'use strict';

    var circular = new Circular(),
        appModel = {
            title: 'Tour of Heroes',
            currentApp: ''
        };

    circular.addRoute({
        path: '(/:appName)(/*)',
        callback: function(data) {
            appModel.currentApp = data.parameters.appName;
        }
    }, true);

    circular.component('app', {
        model: [appModel],
        listeners: ['currentApp'],
        subscribe: renderModule,
        onInit: function(component) {
            appModel.currentApp = appModel.currentApp; // init
            preload(['dashboard', 'heroes'], appModel);
        }
    });

    function renderModule(property, item, value, oldValue) {
        circular.renderModule({
            name: value,
            previousName: oldValue,
            path: 'modules/' + value + '/index.html',
            container: !!property && item.views['app-modules'],
            require: 'app-' + value,
            init: !!property,
            preload: !property,
            transition: function(data) {
                data.promise.then(function() {
                    data.remove();
                    data.append();
                });
            }
        });
    }

    function preload(items, model) {
        items.forEach(function(item) {
            model.currentApp !== item &&
                renderModule(null, model, item, item);
        });
    }
});
