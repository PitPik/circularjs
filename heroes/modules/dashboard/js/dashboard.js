define('app-dashboard', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular();
    var dashboard = null;

    return function init(data, path) {
        heroService.getHeroes().then(function(model) {
            if (dashboard) {
                dashboard.model = model.splice(0, 4);
                return;
            }
            dashboard = circular.component('heroes-dashboard', {
                model: model.splice(0, 4)
            });
        });
    }
});
