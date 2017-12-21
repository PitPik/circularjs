define('app-dashboard', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular();

    return function init(data, path) {
        heroService.getHeroes()
        .then(function(model) {
            circular.component('heroes-dashboard', {
                model: model.splice(0, 4)
            });
        });
    }
});
