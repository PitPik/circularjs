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

/**
 * This file is part of a module, the HTML and it's resources. This
 * module returns a initialisation function 'init'. The purpose of
 * this component inside 'init' is only to render the first 4 items
 * in the hero list that we get via 'heroService.getHeroes()'.
 *
 * The rest of the module is defined in the HTML file (index.html)
 */
